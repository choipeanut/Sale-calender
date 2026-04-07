import { AdminPanel } from "@/components/admin/admin-panel";
import { repository } from "@/lib/repositories/repository";

export default async function AdminPage() {
  const [events, jobs, logs] = await Promise.all([
    repository.listAdminEvents(),
    repository.listCrawlJobs(),
    repository.listNotificationLogs(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
      <p className="text-sm text-slate-600">이벤트 승인/보류, 날짜 수정, 병합, 수집 실행, 알림 로그를 관리합니다.</p>
      <AdminPanel events={events} jobs={jobs} notificationLogs={logs} />
    </div>
  );
}
