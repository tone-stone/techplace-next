-- Permite subir varias imágenes de galería por artículo, además de la foto de portada.
alter table public.articles add column if not exists gallery_urls text[] not null default '{}';
