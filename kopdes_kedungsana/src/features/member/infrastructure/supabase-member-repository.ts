import { MemberRepository } from "../domain/member-repository";
import { Member } from "../domain/member";
import { MemberMonthlySaving } from "../domain/member-monthly-saving";
import { supabase } from "@/src/utils/supabase-client";

export class SupabaseMemberRepository implements MemberRepository {
  async getAll(): Promise<Member[]> {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error [getAll]:", error);
      return [];
    }

    return data.map(this.mapToMemberDomain);
  }

  async findById(id: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.mapToMemberDomain(data);
  }

  async findByNik(nik: string): Promise<Member | null> {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("nik", nik)
      .single();

    if (error || !data) return null;
    return this.mapToMemberDomain(data);
  }

  async add(member: Member): Promise<void> {
    const { error } = await supabase.from("members").insert([
      {
        id: member.id,
        nik: member.nik,
        name: member.name,
        photo_url: member.photoUrl,
        birth_place: member.birthPlace,
        birth_date: member.birthDate,
        gender: member.gender,
        phone: member.phone,
        address: member.address,
        join_date: member.joinDate,
        status: member.status,
        blood_type: member.bloodType,
        religion: member.religion,
        marital_status: member.maritalStatus,
        occupation: member.occupation,
      },
    ]);

    if (error) {
      console.error("Supabase Error [addMember]:", JSON.stringify(error, null, 2));
      throw new Error("Gagal menyimpan anggota ke database Supabase");
    }
  }

  async getMonthlySavingsByMemberId(
    memberId: string,
  ): Promise<MemberMonthlySaving[]> {
    const { data, error } = await supabase
      .from("member_monthly_savings")
      .select("*")
      .eq("member_id", memberId)
      .order("period", { ascending: true });

    if (error) {
      console.error("Supabase Error [getMonthlySavings]:", error);
      return [];
    }

    return data.map(this.mapToSavingDomain);
  }

  async addMonthlySaving(saving: MemberMonthlySaving): Promise<void> {
    const { error } = await supabase.from("member_monthly_savings").insert([
      {
        id: saving.id,
        member_id: saving.memberId,
        period: saving.period,
        required_saving: saving.requiredSaving,
        voluntary_saving: saving.voluntarySaving,
        total_saving: saving.totalSaving,
        input_date: saving.inputDate,
      },
    ]);

    if (error) {
      console.error("Supabase Error [addMonthlySaving]:", JSON.stringify(error, null, 2));
      throw new Error("Gagal menyimpan data simpanan ke database Supabase");
    }
  }

  async updatePhoto(id: string, photoUrl: string): Promise<void> {
    const { error } = await supabase
      .from("members")
      .update({ photo_url: photoUrl })
      .eq("id", id);

    if (error) {
      console.error("Supabase Error [updatePhoto]:", error);
      throw new Error("Gagal memperbarui foto anggota");
    }
  }

  async updateStatus(id: string, status: "aktif" | "nonaktif"): Promise<void> {
    const { error } = await supabase
      .from("members")
      .update({ status: status })
      .eq("id", id);

    if (error) {
      console.error("Supabase Error [updateStatus]:", error);
      throw new Error("Gagal memperbarui status anggota");
    }
  }

  async updateProfile(id: string, updates: Partial<Member>): Promise<void> {
    const dbUpdates: any = {};
    if (updates.nik !== undefined) dbUpdates.nik = updates.nik;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.birthPlace !== undefined) dbUpdates.birth_place = updates.birthPlace;
    if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.joinDate !== undefined) dbUpdates.join_date = updates.joinDate;
    if (updates.bloodType !== undefined) dbUpdates.blood_type = updates.bloodType;
    if (updates.religion !== undefined) dbUpdates.religion = updates.religion;
    if (updates.maritalStatus !== undefined) dbUpdates.marital_status = updates.maritalStatus;
    if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;

    if (Object.keys(dbUpdates).length === 0) return;

    const { error } = await supabase
      .from("members")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("Supabase Error [updateProfile]:", error);
      throw new Error("Gagal memperbarui profil anggota");
    }
  }

  // --- Mappers: DB snake_case to Domain camelCase ---

  private mapToMemberDomain(raw: any): Member {
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
      bloodType: raw.blood_type,
      religion: raw.religion,
      maritalStatus: raw.marital_status,
      occupation: raw.occupation,
    };
  }

  private mapToSavingDomain(raw: any): MemberMonthlySaving {
    return {
      id: raw.id,
      memberId: raw.member_id,
      period: raw.period,
      requiredSaving: Number(raw.required_saving),
      voluntarySaving: Number(raw.voluntary_saving),
      totalSaving: Number(raw.total_saving),
      inputDate: raw.input_date,
    };
  }
}
