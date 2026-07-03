-- Torna o bucket "documentos" privado (passaportes/vistos deixam de ter URL pública
-- adivinhável) e restringe leitura/exclusão a membros da viagem dona do documento.
-- Aplicada em 03/07/2026 (item #4 da AUDITORIA_GERAL).

update storage.buckets
set public = false,
    file_size_limit = 15728640, -- 15MB
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
where id = 'documentos';

-- Leitura/exclusão: só quem é membro da viagem dona do registro em `documentos`.
-- Casa tanto com o path novo (bare path) quanto com URLs públicas antigas já
-- gravadas em `documentos.arquivo_url`, sem precisar mover arquivos existentes.
drop policy if exists "membros leem arquivos de documentos" on storage.objects;
create policy "membros leem arquivos de documentos" on storage.objects for select
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.documentos d
      where d.arquivo_url like '%' || storage.objects.name
        and public.eh_membro(d.viagem_id)
    )
  );

drop policy if exists "membros excluem arquivos de documentos" on storage.objects;
create policy "membros excluem arquivos de documentos" on storage.objects for delete
  using (
    bucket_id = 'documentos'
    and exists (
      select 1 from public.documentos d
      where d.arquivo_url like '%' || storage.objects.name
        and public.eh_membro(d.viagem_id)
    )
  );

-- Upload: exige autenticação. Não dá pra checar `eh_membro` aqui porque o arquivo
-- é enviado antes da linha em `documentos` existir.
drop policy if exists "autenticados enviam arquivos de documentos" on storage.objects;
create policy "autenticados enviam arquivos de documentos" on storage.objects for insert
  with check (bucket_id = 'documentos' and auth.role() = 'authenticated');
