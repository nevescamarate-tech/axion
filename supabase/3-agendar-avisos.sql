-- Axion — passo 3: verificar os avisos a cada minuto (já aplicado no projeto lxoeuyrlbopqatsqaprz)
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('axion-avisos') where exists (select 1 from cron.job where jobname = 'axion-avisos');
select cron.schedule('axion-avisos', '* * * * *', $$
  select net.http_post(
    url     := 'https://lxoeuyrlbopqatsqaprz.supabase.co/functions/v1/send-due',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb);
$$);

-- Limpeza semanal dos avisos já enviados há mais de 30 dias
select cron.unschedule('axion-limpeza') where exists (select 1 from cron.job where jobname = 'axion-limpeza');
select cron.schedule('axion-limpeza', '0 4 * * 0', $$ delete from public.sent_alerts where sent_at < now() - interval '30 days' $$);
