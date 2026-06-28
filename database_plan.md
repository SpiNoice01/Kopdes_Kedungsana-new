# Rencana Integrasi Database Supabase (Koperasi Desa)

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan migrasi dari *In-Memory Database* ke **Supabase** dengan mempertahankan *Clean Architecture*.

## Langkah 1: Persiapan Skema Database di Supabase

Buat dua tabel utama di dalam *SQL Editor* Supabase Anda. Anda dapat me-*copy-paste* perintah DDL berikut:

```sql
-- 1. Tabel Anggota (Members)
CREATE TABLE public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nik VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    photo_url TEXT,
    birth_place VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('laki-laki', 'perempuan')) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    join_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('aktif', 'nonaktif')) NOT NULL,
    blood_type VARCHAR(5),
    religion VARCHAR(50),
    marital_status VARCHAR(50),
    occupation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Tabungan/Simpanan (Monthly Savings)
CREATE TABLE public.member_monthly_savings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    period VARCHAR(10) NOT NULL, -- Format: YYYY-MM
    required_saving DECIMAL(12,2) DEFAULT 0,
    voluntary_saving DECIMAL(12,2) DEFAULT 0,
    total_saving DECIMAL(12,2) DEFAULT 0,
    input_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk pencarian cepat
CREATE INDEX idx_members_nik ON public.members(nik);
CREATE INDEX idx_savings_member_period ON public.member_monthly_savings(member_id, period);
```

## Langkah 2: Instalasi dan Konfigurasi Klien

1. Jalankan perintah instalasi di terminal Anda:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Tambahkan URL dan *Anon Key* Supabase Anda ke file `.env.local` di *root* proyek:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<id-proyek>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<kunci-anon-anda>
   ```

3. Buat file inisialisasi *client* di `src/utils/supabase-client.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

## Langkah 3: Membuat Supabase Repository

Buat file baru bernama `src/features/member/infrastructure/supabase-member-repository.ts`. Kelas ini harus mengimplementasikan *interface* `MemberRepository` yang sama dengan yang dipakai oleh In-Memory.

```typescript
import { MemberRepository } from "../domain/member-repository";
import { Member } from "../domain/member";
import { MemberMonthlySaving } from "../domain/member-monthly-saving";
import { supabase } from "@/src/utils/supabase-client";

export class SupabaseMemberRepository implements MemberRepository {
  
  async getMembers(): Promise<Member[]> {
    const { data, error } = await supabase.from('members').select('*');
    if (error) throw new Error(error.message);
    
    // Mapping dari snake_case (DB) ke camelCase (Domain)
    return data.map(this.mapToDomain);
  }

  async getMemberById(id: string): Promise<Member | null> {
    const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  async getMemberByKtp(nik: string): Promise<Member | null> {
    const { data, error } = await supabase.from('members').select('*').eq('nik', nik).single();
    if (error || !data) return null;
    return this.mapToDomain(data);
  }

  // Lanjutkan dengan implementasi method Add, Update, dll dengan sintaks yang serupa...
  
  private mapToDomain(raw: any): Member {
    return {
      id: raw.id,
      nik: raw.nik,
      name: raw.name,
      photoUrl: raw.photo_url,
      birthPlace: raw.birth_place,
      birthDate: raw.birth_date,
      gender: raw.gender,
      phone: raw.phone,
      address: raw.address,
      joinDate: raw.join_date,
      status: raw.status,
      // ... (map sisa field)
    };
  }
}
```

## Langkah 4: "Tukar Kabel" (Dependency Injection)

Buka file `src/features/member/infrastructure/member-dependencies.ts` dan ubah instansiasi *repository*-nya:

```typescript
// SEBELUMNYA:
// import { InMemoryMemberRepository } from "./in-memory-member-repository";
// const memberRepository = new InMemoryMemberRepository();

// SETELAHNYA (Integrasi Supabase):
import { SupabaseMemberRepository } from "./supabase-member-repository";

// Kita hanya mengganti satu baris ini saja!
const memberRepository = new SupabaseMemberRepository();

// Baris kode di bawahnya (Use Case) TETAP SAMA dan TIDAK PERLU DIUBAH!
const getMembersUseCase = new GetMembersUseCase(memberRepository);
// ...
```

## Selesai! 🎉
Dengan 4 langkah di atas, seluruh aplikasi web Kopdes Anda akan langsung menggunakan Supabase secara nyata (Real-Time) dengan arsitektur skala Enterprise. Tidak ada *React Component* atau halaman yang perlu diedit sama sekali.
