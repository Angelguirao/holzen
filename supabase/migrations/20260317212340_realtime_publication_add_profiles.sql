-- Enable realtime for profiles so client can detect auto-triggered reflections
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;