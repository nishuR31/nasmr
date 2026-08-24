import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapPin, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';

const CATEGORIES = [
  { value: 'WATER', label: '💧 Water', color: 'text-civic-water' },
  { value: 'ROAD', label: '🛣️ Road', color: 'text-civic-road' },
  { value: 'ELECTRICITY', label: '⚡ Electricity', color: 'text-civic-electricity' },
  { value: 'SANITATION', label: '🗑️ Sanitation', color: 'text-civic-sanitation' },
  { value: 'HEALTHCARE', label: '🏥 Healthcare', color: 'text-civic-healthcare' },
  { value: 'EDUCATION', label: '🏫 Education', color: 'text-civic-education' },
  { value: 'TRANSPORT', label: '🚌 Transport', color: 'text-civic-transport' },
  { value: 'OTHER', label: '📋 Other', color: 'text-gray-400' },
];

const schema = z.object({
  text: z.string().min(10, 'Please describe the issue in at least 10 characters'),
  latitude: z.number({ required_error: 'Location is required' }),
  longitude: z.number({ required_error: 'Location is required' }),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ReportForm() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const latitude = watch('latitude');
  const longitude = watch('longitude');
  const address = watch('address');

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setValue('latitude', pos.coords.latitude);
        setValue('longitude', pos.coords.longitude);
        setValue('address', 'Current location (GPS)');
        setLocationLoading(false);
      },
      () => {
        // Default to Ranchi center
        setValue('latitude', 23.3441);
        setValue('longitude', 85.3096);
        setValue('address', 'Ranchi, Jharkhand (approximate)');
        setLocationLoading(false);
      }
    );
  }, [setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/api/reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['map-layers'] });
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center border border-green-500/20 animate-slide-in">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Report Submitted!</h2>
          <p className="text-gray-400 text-sm mb-2">
            Our AI is analyzing your complaint. It will be categorized, scored, and added to the civic intelligence map.
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Your report contributes to building evidence for government action.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => setSubmitted(false)} className="glass border border-dark-border px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-all">
              Submit Another
            </button>
            <button onClick={() => navigate('/map')} className="btn-brand text-sm">
              View on Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Submit a Report</h1>
        <p className="text-gray-500 text-sm">
          Describe any civic issue — road damage, water shortage, power outage, etc.
          You can speak in Hindi or English.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Voice input */}
        <div className="glass rounded-xl p-5 border border-dark-border">
          <p className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            🎤 <span>Voice Input</span>
            <span className="text-xs text-gray-600 font-normal">— Speak in Hindi or English</span>
          </p>
          <div className="flex justify-center">
            <VoiceRecorder
              onTranscription={(text) => setValue('text', text)}
            />
          </div>
        </div>

        {/* Text input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">
            Describe the Issue <span className="text-red-400">*</span>
          </label>
          <textarea
            {...register('text')}
            rows={4}
            placeholder="e.g. There has been no water supply in our area for the past 2 weeks. Around 50 families are affected..."
            className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 border border-dark-border focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30 resize-none transition-all"
          />
          {errors.text && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.text.message}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="glass rounded-xl p-4 border border-dark-border">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-white">Location</span>
            {locationLoading && <Loader2 className="w-3 h-3 text-brand-400 animate-spin" />}
          </div>
          {latitude && longitude ? (
            <div className="space-y-1">
              <p className="text-xs text-gray-400">{address}</p>
              <p className="text-xs text-gray-600 font-mono">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
              <div className="h-1 w-full score-bar mt-2">
                <div className="score-bar-fill" style={{ width: '100%' }} />
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Detecting your location…</p>
          )}
          {errors.latitude && (
            <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {errors.latitude.message}
            </p>
          )}
        </div>

        {/* Category hint */}
        <div className="glass rounded-xl p-4 border border-dark-border">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            AI will auto-detect category
          </p>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map(({ value, label, color }) => (
              <div key={value} className={`text-center text-xs py-1.5 rounded-lg bg-white/3 ${color}`}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending || locationLoading}
          className="btn-brand w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting & analyzing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Report
            </>
          )}
        </button>

        {mutation.isError && (
          <p className="text-sm text-red-400 text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {mutation.error.message || 'Failed to submit. Please try again.'}
          </p>
        )}
      </form>
    </div>
  );
}
