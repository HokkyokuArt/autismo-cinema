import { useEffect, useState, type FormEvent } from "react";
import type { AppUser } from "~/models/user";
import { AuthError } from "~/services/authService";
import { isValidEmail } from "~/utils/validation";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { FormField } from "~/components/common/FormField";
import { UserAvatar } from "~/components/common/UserAvatar";

interface EditProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: AppUser;
  onUpdateEmail: (newEmail: string) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  onUpdateAvatarUrl: (avatarUrl: string | undefined) => void;
  onSuccess: (message: string) => void;
}

interface FieldErrors {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export function EditProfileDialog({
  open,
  onClose,
  user,
  onUpdateEmail,
  onUpdatePassword,
  onUpdateAvatarUrl,
  onSuccess,
}: EditProfileDialogProps) {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAvatarUrl(user.avatarUrl ?? "");
    setEmail(user.email);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setFieldErrors({});
    setFormError(null);
  }, [open, user]);

  const wantsPasswordChange =
    currentPassword.length > 0 || newPassword.length > 0 || confirmNewPassword.length > 0;

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (!isValidEmail(email)) {
      errors.email = "Informe um e-mail válido.";
    }

    if (wantsPasswordChange) {
      if (currentPassword.length === 0) {
        errors.currentPassword = "Informe a senha atual.";
      }
      if (newPassword.length < 6) {
        errors.newPassword = "A nova senha deve ter pelo menos 6 caracteres.";
      }
      if (confirmNewPassword !== newPassword) {
        errors.confirmNewPassword = "As senhas não coincidem.";
      }
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (email.trim().toLowerCase() !== user.email) {
        await onUpdateEmail(email);
      }
      if (avatarUrl.trim() !== (user.avatarUrl ?? "")) {
        onUpdateAvatarUrl(avatarUrl.trim() || undefined);
      }
      if (wantsPasswordChange) {
        await onUpdatePassword(currentPassword, newPassword);
      }
      onSuccess("Perfil atualizado.");
      onClose();
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : "Algo deu errado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDirty =
    avatarUrl.trim() !== (user.avatarUrl ?? "") ||
    email.trim().toLowerCase() !== user.email ||
    wantsPasswordChange;

  return (
    <Dialog open={open} onClose={onClose} title="Editar usuário" isDirty={isDirty}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {formError}
          </p>
        )}

        <div className="flex items-end gap-3">
          <UserAvatar name={user.name} avatarUrl={avatarUrl || undefined} seed={user.id} size={64} />
          <div className="flex-1">
            <FormField
              label="URL da imagem de perfil"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://…"
            />
          </div>
        </div>

        <FormField
          label="E-mail"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />

        <div className="flex flex-col gap-4 border-t border-ink-700 pt-4">
          <p className="text-sm font-medium text-mist-200">Alterar senha (opcional)</p>

          <FormField
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            error={fieldErrors.currentPassword}
          />
          <FormField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            error={fieldErrors.newPassword}
          />
          <FormField
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            error={fieldErrors.confirmNewPassword}
          />
        </div>

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Salvar alterações
        </Button>
      </form>
    </Dialog>
  );
}
