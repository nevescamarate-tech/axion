-- Axion — passo 4: resumo por email (a função só envia às 18:00 de Lisboa; corre de hora a hora por causa da hora de verão)
select cron.unschedule('axion-resumo') where exists (select 1 from cron.job where jobname = 'axion-resumo');
select cron.schedule('axion-resumo', '1 * * * *', $$
  select net.http_post(
    url     := 'https://lxoeuyrlbopqatsqaprz.supabase.co/functions/v1/send-digest',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb);
$$);
