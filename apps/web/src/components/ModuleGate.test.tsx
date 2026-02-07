import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ModuleGate } from "./ModuleGate";
import { useTenantStore } from "@/store/useTenantStore";

afterEach(() => {
  act(() => {
    useTenantStore.getState().clear();
  });
  localStorage.removeItem("etijucas-tenant");
});

describe("ModuleGate", () => {
  it("renders fallback when module is disabled", () => {
    act(() => {
      useTenantStore.setState({
        isBootstrapped: true,
        modules: [
          {
            key: "reports",
            slug: "reports",
            name: "Reports",
            enabled: false,
          },
        ],
      });
    });

    render(
      <ModuleGate module="reports" fallback={<span>indisponivel</span>}>
        <span>conteudo-reports</span>
      </ModuleGate>
    );

    expect(screen.getByText("indisponivel")).toBeInTheDocument();
    expect(screen.queryByText("conteudo-reports")).not.toBeInTheDocument();
  });

  it("renders children when module is enabled", () => {
    act(() => {
      useTenantStore.setState({
        isBootstrapped: true,
        modules: [
          {
            key: "forum",
            slug: "forum",
            name: "Forum",
            enabled: true,
          },
        ],
      });
    });

    render(
      <ModuleGate module="forum" fallback={<span>indisponivel</span>}>
        <span>conteudo-forum</span>
      </ModuleGate>
    );

    expect(screen.getByText("conteudo-forum")).toBeInTheDocument();
    expect(screen.queryByText("indisponivel")).not.toBeInTheDocument();
  });
});
