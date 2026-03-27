import { MemberDetailPage } from "@/src/features/member/presentation/member-detail-page";

type MemberDetailRouteProps = {
  params: Promise<{ memberId: string }>;
};

export default async function MemberDetailRoute({
  params,
}: MemberDetailRouteProps) {
  const { memberId } = await params;

  return <MemberDetailPage memberId={memberId} />;
}
