import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormState = {
  name: string;
  age: string;
  origin: string;
  track: string;
  oath: boolean;
};

const initial: FormState = {
  name: "",
  age: "",
  origin: "",
  track: "demon",
  oath: false,
};

export function EnlistForm({ bare = false }: { bare?: boolean }) {
  const [form, setForm] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.age.trim() || !form.origin.trim()) {
      setError("Complete all fields before submitting.");
      return;
    }
    const ageNum = Number(form.age);
    if (!Number.isFinite(ageNum) || ageNum < 18 || ageNum > 45) {
      setError("Age window is 18–45 Federal standard years.");
      return;
    }
    if (!form.oath) {
      setError("You must acknowledge the service oath to proceed.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={cn(!bare && "panel", "p-6 sm:p-8")} role="status">
        <div className="flex items-start gap-4">
          <span className="icon-bubble mt-0.5 h-10 w-10 shrink-0">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="stencil text-xs tracking-[0.14em] text-primary">Application received</p>
            <h3 className="mt-1 font-display text-2xl font-semibold uppercase tracking-wide text-fg">
              Stand by for orders, {form.name.split(" ")[0] || "trooper"}
            </h3>
            <p className="mt-3 max-w-prose text-sm text-muted">
              Your Join Now packet has been logged. Expect scheduling notice at your
              registered origin station. Welcome to the pipeline for the 1st Mobile Infantry.
            </p>
            <Button
              type="button"
              variant="secondary"
              className="mt-6"
              onClick={() => {
                setForm(initial);
                setSubmitted(false);
              }}
            >
              Submit another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      className={cn(!bare && "panel", bare ? "p-0" : "p-6 sm:p-8")}
      onSubmit={onSubmit}
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full legal name" htmlFor="name">
          <input
            id="name"
            name="name"
            autoComplete="name"
            className={fieldClass}
            placeholder="Surname, given name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>
        <Field label="Age (Federal years)" htmlFor="age">
          <input
            id="age"
            name="age"
            inputMode="numeric"
            className={fieldClass}
            placeholder="18–45"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
          />
        </Field>
        <Field label="Origin / colony" htmlFor="origin" className="sm:col-span-2">
          <input
            id="origin"
            name="origin"
            className={fieldClass}
            placeholder="e.g. Buenos Aires, Terra"
            value={form.origin}
            onChange={(e) => update("origin", e.target.value)}
          />
        </Field>
        <Field label="Preferred company" htmlFor="track" className="sm:col-span-2">
          <select
            id="track"
            name="track"
            className={cn(fieldClass, "appearance-none")}
            value={form.track}
            onChange={(e) => update("track", e.target.value)}
          >
            <option value="demon">Demon — base & ARC defense</option>
            <option value="nightmare">Nightmare — gas & ore / logistics</option>
            <option value="cerberus">Cerberus — QRF</option>
            <option value="hellfire">Hellfire — bug hunters</option>
            <option value="any">Any / Federation need</option>
          </select>
        </Field>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-muted">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-border-strong accent-primary"
          checked={form.oath}
          onChange={(e) => update("oath", e.target.checked)}
        />
        <span>
          I understand Federal Service may include combat assignment to the Mobile Infantry,
          and citizenship is earned only upon honorable completion of term.
        </span>
      </label>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          <Send aria-hidden />
          Join Now!
        </Button>
        <p className="text-xs text-subtle">Demo form — stays in this browser only.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="stencil mb-2 block text-[11px] tracking-[0.12em] text-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-md border border-border bg-bg/80 px-3 text-sm text-fg placeholder:text-subtle outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-primary/50 focus:bg-bg focus:ring-2 focus:ring-primary/20";
