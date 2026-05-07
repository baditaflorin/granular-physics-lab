import {
  Activity,
  Box,
  CircleDollarSign,
  Hand,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Snowflake,
  Star,
  Waves
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildInfo } from "../../../generated/buildInfo";
import {
  defaultStoredSettings,
  readStoredSettings,
  writeStoredSettings
} from "../../../shared/storage";
import { materialKeys, materialPresets } from "../physics/materials";
import type { GranularScene } from "../engine/GranularScene";
import type {
  LabMetrics,
  LabSettings,
  MaterialKey,
  QualityMode,
  RigidSetup,
  ToolMode
} from "../physics/types";

const githubUrl = "https://github.com/baditaflorin/granular-physics-lab";
const paypalUrl = "https://www.paypal.com/paypalme/florinbadita";

const initialMetrics: LabMetrics = {
  fps: 0,
  particleCount: 0,
  renderer: "WebGL fallback",
  kernel: "TypeScript fallback",
  flowingRatio: 0,
  transitionRatio: 0,
  jammedRatio: 0,
  averageSpeed: 0,
  rigidSetup: "ramp"
};

const materialIcons = {
  sand: Waves,
  gravel: Mountain,
  snow: Snowflake
} satisfies Record<MaterialKey, typeof Waves>;

export function LabPage() {
  const [settings, setSettings] = useState<LabSettings>(() => readStoredSettings());
  const [metrics, setMetrics] = useState<LabMetrics>(initialMetrics);
  const [isPouring, setIsPouring] = useState(true);
  const [tool, setTool] = useState<ToolMode>("pour");
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<GranularScene | null>(null);

  const commitUrl = useMemo(() => {
    if (String(buildInfo.fullCommit) === "dev") {
      return githubUrl;
    }
    return `${githubUrl}/commit/${buildInfo.fullCommit}`;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let disposed = false;
    let scene: GranularScene | null = null;

    void import("../engine/GranularScene").then(({ GranularScene }) => {
      if (disposed) {
        return;
      }

      scene = new GranularScene(mount, settings, setMetrics);
      sceneRef.current = scene;
      void scene.start();
    });

    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    writeStoredSettings(settings);
    sceneRef.current?.updateSettings(settings);
  }, [settings]);

  useEffect(() => {
    sceneRef.current?.setPouring(isPouring);
  }, [isPouring]);

  useEffect(() => {
    sceneRef.current?.setTool(tool);
  }, [tool]);

  function updateSettings(partial: Partial<LabSettings>) {
    setSettings((current) => ({ ...current, ...partial }));
  }

  function runPile() {
    sceneRef.current?.pile();
  }

  function runSlide() {
    const next = { ...settings, rigidSetup: "ramp" as const, tiltDegrees: 16 };
    setSettings(next);
    sceneRef.current?.updateSettings(next);
    sceneRef.current?.slide();
  }

  function resetLab() {
    sceneRef.current?.clear();
    sceneRef.current?.pile();
  }

  function restoreDefaults() {
    setSettings(defaultStoredSettings);
    sceneRef.current?.clear();
    sceneRef.current?.pile();
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <h1>Granular Physics Lab</h1>
          <p>Sand, gravel, and snow in a browser-native materials sandbox.</p>
        </div>
        <nav className="top-actions" aria-label="Project links">
          <a href={githubUrl} target="_blank" rel="noreferrer" title="Star the GitHub repository">
            <Star aria-hidden="true" />
            Star on GitHub
          </a>
          <a
            href={paypalUrl}
            target="_blank"
            rel="noreferrer"
            title="Support the project on PayPal"
          >
            <CircleDollarSign aria-hidden="true" />
            PayPal
          </a>
        </nav>
      </header>

      <section className="lab-grid" aria-label="Granular simulation workspace">
        <aside className="panel controls" aria-label="Simulation controls">
          <SectionTitle icon={Hand} title="Experiment" />
          <div className="toolbar-row">
            <button
              className={isPouring ? "command active" : "command"}
              type="button"
              onClick={() => setIsPouring((value) => !value)}
              title={isPouring ? "Pause pouring" : "Resume pouring"}
            >
              {isPouring ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              {isPouring ? "Pause" : "Pour"}
            </button>
            <button className="command" type="button" onClick={runPile} title="Drop a pile sample">
              <Mountain aria-hidden="true" />
              Pile
            </button>
            <button
              className="command"
              type="button"
              onClick={runSlide}
              title="Run a slope slide test"
            >
              <Activity aria-hidden="true" />
              Slide
            </button>
            <button
              className="icon-command"
              type="button"
              onClick={resetLab}
              title="Reset particles"
            >
              <RotateCcw aria-label="Reset particles" />
            </button>
          </div>

          <ControlGroup label="Material">
            <div className="segmented" role="radiogroup" aria-label="Material">
              {materialKeys.map((key) => {
                const Icon = materialIcons[key];
                return (
                  <button
                    key={key}
                    className={settings.material === key ? "segment active" : "segment"}
                    type="button"
                    role="radio"
                    aria-checked={settings.material === key}
                    onClick={() => updateSettings({ material: key })}
                    title={materialPresets[key].description}
                  >
                    <Icon aria-hidden="true" />
                    {materialPresets[key].label}
                  </button>
                );
              })}
            </div>
          </ControlGroup>

          <ControlGroup label="Tool">
            <div className="segmented" role="radiogroup" aria-label="Pointer tool">
              {(["pour", "inspect", "plow"] as ToolMode[]).map((item) => (
                <button
                  key={item}
                  className={tool === item ? "segment active" : "segment"}
                  type="button"
                  role="radio"
                  aria-checked={tool === item}
                  onClick={() => setTool(item)}
                  title={`${item} pointer mode`}
                >
                  {item}
                </button>
              ))}
            </div>
          </ControlGroup>

          <Slider
            label="Flow"
            value={settings.flowRate}
            min={0}
            max={140}
            step={1}
            unit="/s"
            onChange={(flowRate) => updateSettings({ flowRate })}
          />
          <Slider
            label="Tilt"
            value={settings.tiltDegrees}
            min={-28}
            max={28}
            step={1}
            unit="deg"
            onChange={(tiltDegrees) => updateSettings({ tiltDegrees })}
          />
          <Slider
            label="Cohesion"
            value={settings.cohesionBoost}
            min={0}
            max={1}
            step={0.01}
            unit=""
            onChange={(cohesionBoost) => updateSettings({ cohesionBoost })}
          />
          <Slider
            label="Budget"
            value={settings.particleBudget}
            min={120}
            max={1100}
            step={10}
            unit=""
            onChange={(particleBudget) => updateSettings({ particleBudget })}
          />

          <ControlGroup label="Rigid bodies">
            <div className="segmented" role="radiogroup" aria-label="Rigid body setup">
              {(["basin", "ramp", "intruder"] as RigidSetup[]).map((item) => (
                <button
                  key={item}
                  className={settings.rigidSetup === item ? "segment active" : "segment"}
                  type="button"
                  role="radio"
                  aria-checked={settings.rigidSetup === item}
                  onClick={() => updateSettings({ rigidSetup: item })}
                >
                  <Box aria-hidden="true" />
                  {item}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="Quality">
            <div className="segmented two" role="radiogroup" aria-label="Quality">
              {(["balanced", "dense"] as QualityMode[]).map((item) => (
                <button
                  key={item}
                  className={settings.quality === item ? "segment active" : "segment"}
                  type="button"
                  role="radio"
                  aria-checked={settings.quality === item}
                  onClick={() => updateSettings({ quality: item })}
                >
                  {item}
                </button>
              ))}
            </div>
          </ControlGroup>

          <button className="secondary-command" type="button" onClick={restoreDefaults}>
            Restore defaults
          </button>
        </aside>

        <section className="stage-panel" aria-label="Simulation viewport">
          <div className="stage" ref={mountRef} data-testid="simulation-stage" />
          <div className="stage-overlay">
            <span>{metrics.renderer}</span>
            <span>{metrics.kernel}</span>
            <span data-testid="particle-count">{metrics.particleCount} grains</span>
          </div>
        </section>

        <aside className="panel readout" aria-label="Simulation readout">
          <SectionTitle icon={Activity} title="Phase Map" />
          <Metric label="FPS" value={metrics.fps.toFixed(0)} />
          <Metric label="Particles" value={String(metrics.particleCount)} />
          <Metric label="Speed" value={metrics.averageSpeed.toFixed(2)} />
          <PhaseBar
            flowing={metrics.flowingRatio}
            transition={metrics.transitionRatio}
            jammed={metrics.jammedRatio}
          />

          <div className="phase-legend" aria-label="Phase legend">
            <span>
              <i className="flowing" /> flowing
            </span>
            <span>
              <i className="transition" /> transition
            </span>
            <span>
              <i className="jammed" /> jammed
            </span>
          </div>

          <div className="science-note">
            <h2>Teaching Focus</h2>
            <p>
              Watch contacts accumulate into a jammed pile, then use tilt and cohesion to break it
              back into flowing grains.
            </p>
          </div>

          <div className="link-map">
            <a href={githubUrl} target="_blank" rel="noreferrer">
              <Star aria-hidden="true" />
              https://github.com/baditaflorin/granular-physics-lab
            </a>
            <a href={paypalUrl} target="_blank" rel="noreferrer">
              <CircleDollarSign aria-hidden="true" />
              https://www.paypal.com/paypalme/florinbadita
            </a>
          </div>

          <footer className="build-stamp">
            <span>v{buildInfo.version}</span>
            <a href={commitUrl} target="_blank" rel="noreferrer">
              commit {buildInfo.shortCommit}
            </a>
          </footer>
        </aside>
      </section>
    </main>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Activity; title: string }) {
  return (
    <div className="section-title">
      <Icon aria-hidden="true" />
      <h2>{title}</h2>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="control-group">
      <span className="control-label">{label}</span>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="slider-row">
      <span>
        {label}
        <b>
          {Number.isInteger(value) ? value : value.toFixed(2)}
          {unit}
        </b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function PhaseBar({
  flowing,
  transition,
  jammed
}: {
  flowing: number;
  transition: number;
  jammed: number;
}) {
  return (
    <div className="phase-bar" aria-label="Granular phase distribution">
      <span className="flowing" style={{ inlineSize: `${Math.max(2, flowing * 100)}%` }} />
      <span className="transition" style={{ inlineSize: `${Math.max(2, transition * 100)}%` }} />
      <span className="jammed" style={{ inlineSize: `${Math.max(2, jammed * 100)}%` }} />
    </div>
  );
}
