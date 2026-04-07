import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { PushRegisterButton } from "@/components/settings/push-register";
import { repository } from "@/lib/repositories/repository";

export default async function NotificationSettingsPage() {
  const preferences = await repository.listNotificationPreferences("demo-user");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">알림 설정</h1>
      <p className="text-sm text-slate-600">시작 7일 전/1일 전/당일과 커스텀 알림을 조절할 수 있습니다.</p>
      <PushRegisterButton />
      <NotificationSettingsForm preferences={preferences} />
    </div>
  );
}
