import { expect, it, vi } from "vitest";
import { Type } from "@bindings/internal/connection/models";
import type { Profile } from "@bindings/internal/profile/models";
import i18n from "@/i18n";
import { act, render, screen, userEvent, waitFor } from "@/test/render";
import { DeleteServerModal } from "./DeleteServerModal";

const profile: Profile = {
  id: "example-server",
  name: "Example Server",
  connectionType: Type.TypeRCON,
  host: "127.0.0.1",
  port: 27015,
  version: "42",
};

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

it("confirms deletion through the modal and closes after it succeeds", async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  const deleteRequest = deferred();
  const onDelete = vi.fn().mockReturnValue(deleteRequest.promise);

  render(
    <DeleteServerModal
      onClose={onClose}
      onDelete={onDelete}
      opened
      profile={profile}
    />,
  );

  expect(screen.getByRole("dialog")).toHaveTextContent(profile.name);

  await user.click(
    screen.getByRole("button", {
      name: i18n.t("actions.delete", { ns: "common" }),
    }),
  );

  expect(onDelete).toHaveBeenCalledOnce();
  expect(onDelete).toHaveBeenCalledWith(profile);
  expect(onClose).not.toHaveBeenCalled();

  await act(async () => {
    deleteRequest.resolve();
    await deleteRequest.promise;
  });

  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
});
