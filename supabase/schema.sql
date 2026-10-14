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
alter table public.siswa add column if not exists tanggal_bergabung date;
alter table public.siswa add column if not exists hari_les_1 smallint;
alter table public.siswa add column if not exists jam_les_1 time;
alter table public.siswa add column if not exists hari_les_2 smallint;
alter table public.siswa add column if not exists jam_les_2 time;
alter table public.siswa drop constraint if exists siswa_jadwal_hari_check;
alter table public.siswa add constraint siswa_jadwal_hari_check check (
  (hari_les_1 is null or hari_les_1 between 0 and 6)
  and (hari_les_2 is null or hari_les_2 between 0 and 6)
  and (hari_les_1 is null or hari_les_2 is null or hari_les_1 <> hari_les_2)
);
alter table public.siswa alter column kelas drop not null;
alter table public.mentor add column if not exists telepon text;
alter table public.mentor alter column keahlian drop not null;
alter table public.mentor alter column status drop not null;
alter table public.mentor add column if not exists kapasitas_murid integer not null default 4;
alter table public.mentor add column if not exists tarif_per_anak numeric(14, 2) not null default 0;
alter table public.mentor add column if not exists tanggal_bayar smallint;
alter table public.mentor drop constraint if exists mentor_kapasitas_murid_check;
alter table public.mentor add constraint mentor_kapasitas_murid_check check (kapasitas_murid > 0);
alter table public.mentor drop constraint if exists mentor_tarif_per_anak_check;
alter table public.mentor add constraint mentor_tarif_per_anak_check check (tarif_per_anak >= 0);
alter table public.mentor drop constraint if exists mentor_tanggal_bayar_check;
alter table public.mentor add constraint mentor_tanggal_bayar_check check (tanggal_bayar is null or tanggal_bayar between 1 and 31);

insert into public.program (nama, spp)
values ('Matematika dasar', 350000), ('Berhitung ceria', 350000)
on conflict (nama) do nothing;

create table if not exists public.penugasan_mentor (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jam_mulai time,
  mentor_id uuid not null references public.mentor(id) on delete restrict,
  siswa_id uuid not null references public.siswa(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tanggal, siswa_id)
);

create index if not exists penugasan_mentor_mentor_tanggal_idx
  on public.penugasan_mentor (mentor_id, tanggal);

create table if not exists public.pengaturan (
  id text primary key,
  tanggal_bayar smallint not null default 5 check (tanggal_bayar between 1 and 31),
  nama_rekening text not null default '',
  nomor_rekening text not null default '',
  nama_pemilik_rekening text not null default '',
  qris_image text not null default '',
  created_at timestamptz not null default now()
);

alter table public.pengaturan add column if not exists nama_rekening text not null default '';
alter table public.pengaturan add column if not exists nomor_rekening text not null default '';
alter table public.pengaturan add column if not exists nama_pemilik_rekening text not null default '';
alter table public.pengaturan add column if not exists qris_image text not null default '';

insert into public.pengaturan (id, tanggal_bayar)
values ('global', 5)
on conflict (id) do nothing;

create table if not exists public.pembayaran_mentor (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentor(id) on delete restrict,
  nama_mentor text not null,
  periode date not null,
  jumlah_siswa integer not null check (jumlah_siswa > 0),
  tarif_per_anak numeric(14, 2) not null check (tarif_per_anak >= 0),
  jumlah numeric(14, 2) not null check (jumlah > 0),
  tanggal_bayar date not null,
  created_at timestamptz not null default now(),
  unique (mentor_id, periode)
);

alter table public.penugasan_mentor add column if not exists hadir_at timestamptz;
alter table public.penugasan_mentor add column if not exists jam_mulai time;

create or replace function public.enforce_mentor_daily_capacity()
returns trigger
language plpgsql
as $$
declare
  max_students integer;
  current_count integer;
  candidate_start timestamp;
  candidate_end timestamp;
  check_time timestamp;
begin
  select kapasitas_murid into max_students
  from public.mentor
  where id = new.mentor_id
  for update;

  if max_students is null then
    raise exception 'Mentor tidak ditemukan.';
  end if;

  if new.jam_mulai is null then
    raise exception 'Jam mulai les harus diisi untuk memvalidasi kapasitas mentor.';
  end if;

  candidate_start := new.tanggal + new.jam_mulai;
  candidate_end := candidate_start + interval '60 minutes';
  for check_time in
    select candidate_start
    union
    select (assignment.tanggal + assignment.jam_mulai)::timestamp
    from public.penugasan_mentor assignment
    where assignment.mentor_id = new.mentor_id
      and assignment.tanggal = new.tanggal
      and assignment.id is distinct from new.id
      and assignment.jam_mulai is not null
      and assignment.tanggal + assignment.jam_mulai > candidate_start
      and assignment.tanggal + assignment.jam_mulai < candidate_end
  loop
    select count(*) into current_count
    from public.penugasan_mentor assignment
    where assignment.mentor_id = new.mentor_id
      and assignment.tanggal = new.tanggal
      and assignment.id is distinct from new.id
      and assignment.jam_mulai is not null
      and assignment.tanggal + assignment.jam_mulai <= check_time
      and assignment.tanggal + assignment.jam_mulai + interval '60 minutes' > check_time;

    if current_count + 1 > max_students then
      raise exception 'Mentor sudah mencapai batas maksimal murid yang bersamaan pada jam tersebut.';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists penugasan_mentor_capacity_check on public.penugasan_mentor;
create trigger penugasan_mentor_capacity_check
  before insert or update of mentor_id, tanggal on public.penugasan_mentor
  for each row execute function public.enforce_mentor_daily_capacity();

alter table public.siswa enable row level security;
alter table public.mentor enable row level security;
alter table public.keuangan enable row level security;
alter table public.program enable row level security;
alter table public.biaya_tetap enable row level security;
alter table public.penugasan_mentor enable row level security;
alter table public.pembayaran_mentor enable row level security;
alter table public.pengaturan enable row level security;

grant select, insert, update, delete on public.siswa to authenticated;
grant select, insert, update, delete on public.mentor to authenticated;
grant select, insert, update, delete on public.keuangan to authenticated;
grant select, insert, update, delete on public.program to authenticated;
grant select, insert, update, delete on public.biaya_tetap to authenticated;
grant select, insert, update, delete on public.penugasan_mentor to authenticated;
grant select, insert, update, delete on public.pembayaran_mentor to authenticated;
grant select, insert, update, delete on public.pengaturan to authenticated;

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

drop policy if exists "Authenticated users can manage penugasan_mentor" on public.penugasan_mentor;
create policy "Authenticated users can manage penugasan_mentor"
  on public.penugasan_mentor for all to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage pembayaran_mentor" on public.pembayaran_mentor;
create policy "Authenticated users can manage pembayaran_mentor"
  on public.pembayaran_mentor for all to authenticated
  using (true) with check (true);

drop policy if exists "Authenticated users can manage pengaturan" on public.pengaturan;
create policy "Authenticated users can manage pengaturan"
  on public.pengaturan for all to authenticated
  using (true) with check (true);