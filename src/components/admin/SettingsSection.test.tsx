import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import SettingsSection from "./SettingsSection";

const settings = {
  orgName: "TechPlace",
  billingFromEmail: "cobranza@techplacetj.com",
  billingReminderLeadDays: 3,
};

describe("SettingsSection", () => {
  it("pre-fills the org settings form", () => {
    render(<SettingsSection settings={settings} env={{ resend: true, cron: true, fromEmail: true }} />);
    expect(screen.getByDisplayValue("TechPlace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("cobranza@techplacetj.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
  });

  it("shows each env var as configured or missing", () => {
    render(
      <SettingsSection
        settings={settings}
        env={{ resend: false, cron: true, fromEmail: false }}
      />
    );
    expect(screen.getByText("CRON_SECRET")).toBeInTheDocument();
    expect(screen.getByText("RESEND_API_KEY")).toBeInTheDocument();
    // one "configurado" (cron) + two hints for the missing ones
    expect(screen.getByText(/configurado/)).toBeInTheDocument();
    expect(screen.getAllByText(/falta/).length).toBeGreaterThanOrEqual(1);
  });
});
