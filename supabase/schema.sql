create table if not exists public.siswa (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kelas text not null,
  status text not null check (status in ('Aktif', 'Menunggu')),
  created_at timestamptz not null default now()
);

create table if not exists public.mentor (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  keahlian text not null,
  status text not null check (status in ('Aktif', 'Menunggu')),
  created_at timestamptz not null default now()
);

create table if not exists public.keuangan (
  id uuid primary key default gen_random_uuid(),
  deskripsi text not null,
  jenis text not null check (jenis in ('Pemasukan', 'Pengeluaran')),
  jumlah numeric(14, 2) not null check (jumlah > 0),
  tanggal date not null,
  created_at timestamptz not null default now()
);

alter table public.siswa enable row level security;
alter table public.mentor enable row level security;
alter table public.keuangan enable row level security;

grant select, insert, update, delete on public.siswa to authenticated;
grant select, insert, update, delete on public.mentor to authenticated;
grant select, insert, update, delete on public.keuangan to authenticated;

drop policy if exists "Authenticated users can manage siswa" on public.siswa;
create policy "Authenticated users can manage siswa"
  on public.siswa for all to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage mentor" on public.mentor;
create policy "Authenticated users can manage mentor"
  on public.mentor for all to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage keuangan" on public.keuangan;
create policy "Authenticated users can manage keuangan"
  on public.keuangan for all to authenticated
  using (true) with check (true);
