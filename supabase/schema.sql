create table if not exists public.siswa (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  kelas text,
  asal_sekolah text,
  telepon_orang_tua text,
  nama_orang_tua text,
  usia integer check (usia is null or usia > 0),
  program_id uuid,
  program text,
  spp numeric(14, 2) check (spp is null or spp >= 0),
  status text not null check (status in ('Aktif', 'Menunggu')),
  created_at timestamptz not null default now()
);

create table if not exists public.mentor (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  telepon text,
  keahlian text,
  status text check (status is null or status in ('Aktif', 'Menunggu')),
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

create table if not exists public.program (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  spp numeric(14, 2) not null check (spp > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.biaya_tetap (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  jumlah numeric(14, 2) not null check (jumlah > 0),
  tanggal_mulai date not null,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.siswa add column if not exists asal_sekolah text;
alter table public.siswa add column if not exists telepon_orang_tua text;
alter table public.siswa add column if not exists nama_orang_tua text;
alter table public.siswa add column if not exists usia integer;
alter table public.siswa add column if not exists program_id uuid;
alter table public.siswa add column if not exists program text;
alter table public.siswa add column if not exists spp numeric(14, 2);
alter table public.siswa alter column kelas drop not null;
alter table public.mentor add column if not exists telepon text;
alter table public.mentor alter column keahlian drop not null;
alter table public.mentor alter column status drop not null;

insert into public.program (nama, spp)
values ('Matematika dasar', 350000), ('Berhitung ceria', 350000)
on conflict (nama) do nothing;

alter table public.siswa enable row level security;
alter table public.mentor enable row level security;
alter table public.keuangan enable row level security;
alter table public.program enable row level security;
alter table public.biaya_tetap enable row level security;

grant select, insert, update, delete on public.siswa to authenticated;
grant select, insert, update, delete on public.mentor to authenticated;
grant select, insert, update, delete on public.keuangan to authenticated;
grant select, insert, update, delete on public.program to authenticated;
grant select, insert, update, delete on public.biaya_tetap to authenticated;

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

drop policy if exists "Authenticated users can manage program" on public.program;
create policy "Authenticated users can manage program"
  on public.program for all to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage biaya_tetap" on public.biaya_tetap;
create policy "Authenticated users can manage biaya_tetap"
  on public.biaya_tetap for all to authenticated
  using (true) with check (true);
