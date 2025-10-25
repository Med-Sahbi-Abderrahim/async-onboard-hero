import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FormSettings {
  send_reminders: boolean;
  redirect_url?: string;
  is_public: boolean;
}

interface FormSettingsSectionProps {
  settings: FormSettings;
  onChange: (settings: FormSettings) => void;
}

export function FormSettingsSection({ settings, onChange }: FormSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Settings</h3>

      <div className="flex items-center space-x-2">
        <Switch
          id="send-reminders"
          checked={settings.send_reminders}
          onCheckedChange={(checked) => onChange({ ...settings, send_reminders: checked })}
        />
        <Label htmlFor="send-reminders" className="cursor-pointer">
          Send client reminders
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is-public"
          checked={settings.is_public}
          onCheckedChange={(checked) => onChange({ ...settings, is_public: checked })}
        />
        <Label htmlFor="is-public" className="cursor-pointer">
          Make form public
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="redirect-url">Redirect URL (after submission)</Label>
        <Input
          id="redirect-url"
          type="url"
          value={settings.redirect_url || ""}
          onChange={(e) => onChange({ ...settings, redirect_url: e.target.value })}
          placeholder="https://myapp.com/thank-you"
        />
      </div>
    </div>
  );
}
