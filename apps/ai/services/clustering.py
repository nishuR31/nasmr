import numpy as np
from sklearn.cluster import DBSCAN
from shapely.geometry import MultiPoint
from typing import Any


EARTH_RADIUS_KM = 6371.0


def haversine_matrix(coords: np.ndarray) -> np.ndarray:
    """Compute pairwise haversine distances in km."""
    lat = np.radians(coords[:, 0])
    lng = np.radians(coords[:, 1])
    
    lat_i = lat[:, np.newaxis]
    lat_j = lat[np.newaxis, :]
    lng_i = lng[:, np.newaxis]
    lng_j = lng[np.newaxis, :]
    
    dlat = lat_j - lat_i
    dlng = lng_j - lng_i
    a = np.sin(dlat / 2) ** 2 + np.cos(lat_i) * np.cos(lat_j) * np.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(a))


def run_dbscan(
    coords: list[tuple[float, float]],
    report_ids: list[str],
    categories: list[str],
    epsilon_km: float = 1.5,
    min_samples: int = 5,
) -> list[dict[str, Any]]:
    """
    Run DBSCAN spatial clustering on lat/lng coordinates.
    Returns a list of cluster dicts with centroid, boundary polygon, and metadata.
    """
    if len(coords) < min_samples:
        return []

    coords_arr = np.array(coords)
    dist_matrix = haversine_matrix(coords_arr)

    db = DBSCAN(
        eps=epsilon_km,
        min_samples=min_samples,
        metric="precomputed",
    ).fit(dist_matrix)

    labels = db.labels_
    unique_labels = set(labels) - {-1}

    clusters = []
    for label in unique_labels:
        mask = labels == label
        cluster_coords = coords_arr[mask]
        cluster_ids = [rid for rid, m in zip(report_ids, mask) if m]
        cluster_cats = [c for c, m in zip(categories, mask) if m]

        # Dominant category
        cat_counts: dict[str, int] = {}
        for cat in cluster_cats:
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        dominant_cat = max(cat_counts, key=lambda k: cat_counts[k])

        # Centroid
        center_lat = float(cluster_coords[:, 0].mean())
        center_lng = float(cluster_coords[:, 1].mean())

        # Convex hull boundary
        boundary = None
        try:
            points = MultiPoint([(lng, lat) for lat, lng in cluster_coords])
            hull = points.convex_hull
            if hull.geom_type == "Polygon":
                coords_list = list(hull.exterior.coords)
                boundary = {
                    "type": "Polygon",
                    "coordinates": [[[c[0], c[1]] for c in coords_list]],
                }
        except Exception:
            pass

        clusters.append({
            "label": int(label),
            "category": dominant_cat,
            "center_lat": center_lat,
            "center_lng": center_lng,
            "report_count": int(mask.sum()),
            "report_ids": cluster_ids,
            "boundary": boundary,
        })

    # Sort by size descending
    clusters.sort(key=lambda c: c["report_count"], reverse=True)
    noise_count = int((labels == -1).sum())

    return clusters, noise_count


def compute_priority_score(
    report_count: int,
    avg_severity: float,
    affected_population: int,
    persistence_days: int,
    vulnerable_fraction: float = 0.0,
    infrastructure_gap: float = 0.5,
) -> dict[str, float]:
    """
    Deterministic priority scoring formula:
      30% citizen demand
      20% severity
      15% population affected
      15% persistence
      10% vulnerable population
      10% infrastructure gap
    """
    # Normalize each dimension to 0–1
    demand = min(1.0, report_count / 500)  # 500 reports = max demand
    severity = float(avg_severity)
    population = min(1.0, affected_population / 10000)  # 10k = max
    persistence = min(1.0, persistence_days / 180)  # 6 months = max
    vulnerable = float(vulnerable_fraction)
    infra = float(infrastructure_gap)

    score = (
        0.30 * demand
        + 0.20 * severity
        + 0.15 * population
        + 0.15 * persistence
        + 0.10 * vulnerable
        + 0.10 * infra
    ) * 100  # convert to 0–100

    return {
        "score": round(score, 1),
        "citizen_demand": round(demand * 100, 1),
        "severity": round(severity * 100, 1),
        "population_affected": round(population * 100, 1),
        "persistence": round(persistence * 100, 1),
        "vulnerable_population": round(vulnerable * 100, 1),
        "infrastructure_gap": round(infra * 100, 1),
    }
