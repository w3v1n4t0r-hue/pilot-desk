(() => {
  "use strict";
  let active = null;
  const $ = (id) => document.getElementById(id),
    core = () => window.PilotDeskAircraftPerformanceCore;
  function settings() {
    if (!$("rpPohEnabled")?.checked) return null;
    return {
      table: {
        source: $("rpPohSource").value,
        configuration: $("rpPohConfig").value,
        rows: JSON.parse($("rpPohRows").value),
      },
      conditions: Object.fromEntries(
        ["weight", "oat", "pressureOffset", "lapseRate"].map((k) => [
          k,
          $("rpPoh_" + k).value,
        ]),
      ),
    };
  }
  function apply(value) {
    active = value || null;
    if (!$("rpPohEnabled")) return;
    $("rpPohEnabled").checked = !!value;
    $("rpPohSource").value = value?.table?.source || "";
    $("rpPohConfig").value = value?.table?.configuration || "";
    $("rpPohRows").value = JSON.stringify(value?.table?.rows || [], null, 2);
    for (const k of ["weight", "oat", "pressureOffset", "lapseRate"])
      $("rpPoh_" + k).value = value?.conditions?.[k] ?? "";
  }
  window.PilotDeskAircraftPerformance = {
    getSettings: settings,
    setSettings: apply,
    loadProfile: (profile) =>
      apply(
        profile?.performanceTable
          ? { table: profile.performanceTable, conditions: {} }
          : null,
      ),
  };
  function init() {
    if (!$("rpPohEnabled")) return;
    apply(active);
    $("rpImportPoh").onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 1048576) throw Error("POH import exceeds 1 MB.");
        const text = await file.text(),
          rows = file.name.toLowerCase().endsWith(".json")
            ? JSON.parse(text)
            : core().csv(text);
        core().validate({
          source: $("rpPohSource").value,
          configuration: $("rpPohConfig").value,
          rows,
        });
        $("rpPohRows").value = JSON.stringify(rows, null, 2);
        $("rpPohRows").dispatchEvent(new Event("input", { bubbles: true }));
        $("rpPohStatus").textContent =
          rows.length +
          " POH rows imported. Verify source, units and configuration.";
      } catch (error) {
        $("rpPohStatus").textContent = error.message;
      } finally {
        e.target.value = "";
      }
    };
    $("rpPohTemplate").onclick = () => {
      const url = URL.createObjectURL(
          new Blob([[...core().axes, ...core().values].join(",") + "\n"], {
            type: "text/csv",
          }),
        ),
        link = document.createElement("a");
      link.href = url;
      link.download = "pilotdesk-poh-columns.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    $("rpSavePoh").onclick = () => {
      try {
        const value = settings();
        if (!value) throw Error("Enable the POH table first.");
        core().validate(value.table);
        const profiles = JSON.parse(
            localStorage.getItem("pd-aircraft") || "[]",
          ),
          profile = profiles.find((p) => p.id === $("rpAircraft")?.value);
        if (!profile) throw Error("Select a saved aircraft profile first.");
        profile.performanceTable = value.table;
        profile.updatedAt = Date.now();
        localStorage.setItem("pd-aircraft", JSON.stringify(profiles));
        document.dispatchEvent(new CustomEvent("pilotdesk:aircraft-changed"));
        $("rpPohStatus").textContent = "POH table saved to " + profile.name;
      } catch (e) {
        $("rpPohStatus").textContent = e.message;
      }
    };
    let timer;
    for (const input of $("rpPohEditor").querySelectorAll("input,textarea"))
      input.addEventListener("input", () => {
        window.PilotDeskRoutePlanner?.invalidate();
        clearTimeout(timer);
        timer = setTimeout(() => window.PilotDeskRoutePlanner?.rebuild(), 900);
        document.dispatchEvent(new CustomEvent("pilotdesk:planning-changed"));
      });
  }
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init();
})();
