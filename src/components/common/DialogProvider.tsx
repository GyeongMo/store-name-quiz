import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertState {
  type: 'alert';
  message: string;
  okText?: string;
  resolve: () => void;
}

interface ConfirmState {
  type: 'confirm';
  message: string;
  okText?: string;
  cancelText?: string;
  resolve: (ok: boolean) => void;
}

interface PromptState {
  type: 'prompt';
  message: string;
  defaultValue: string;
  placeholder?: string;
  resolve: (value: string | null) => void;
}

interface ChoiceState {
  type: 'choice';
  message: string;
  choices: string[];
  resolve: (index: number) => void;
}

type DialogState = AlertState | ConfirmState | PromptState | ChoiceState;

interface DialogContextType {
  alert: (message: string, opts?: { okText?: string }) => Promise<void>;
  confirm: (
    message: string,
    opts?: { okText?: string; cancelText?: string },
  ) => Promise<boolean>;
  prompt: (
    message: string,
    opts?: { defaultValue?: string; placeholder?: string },
  ) => Promise<string | null>;
  choice: (message: string, choices: string[]) => Promise<number>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const api = useMemo<DialogContextType>(
    () => ({
      alert: (message, opts) =>
        new Promise<void>((resolve) => {
          setDialog({ type: 'alert', message, okText: opts?.okText, resolve });
        }),
      confirm: (message, opts) =>
        new Promise<boolean>((resolve) => {
          setDialog({
            type: 'confirm',
            message,
            okText: opts?.okText,
            cancelText: opts?.cancelText,
            resolve,
          });
        }),
      prompt: (message, opts) =>
        new Promise<string | null>((resolve) => {
          setPromptValue(opts?.defaultValue ?? '');
          setDialog({
            type: 'prompt',
            message,
            defaultValue: opts?.defaultValue ?? '',
            placeholder: opts?.placeholder,
            resolve,
          });
        }),
      choice: (message, choices) =>
        new Promise<number>((resolve) => {
          setDialog({ type: 'choice', message, choices, resolve });
        }),
    }),
    [],
  );

  const close = useCallback(
    <T,>(result: T) => {
      if (!dialog) return;
      (dialog.resolve as (r: T) => void)(result);
      setDialog(null);
      setPromptValue('');
    },
    [dialog],
  );

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dialog.type === 'alert') close(undefined);
        else if (dialog.type === 'confirm') close(false);
        else if (dialog.type === 'prompt') close(null);
        else if (dialog.type === 'choice') close(-1);
      } else if (e.key === 'Enter') {
        if (dialog.type === 'alert') close(undefined);
        else if (dialog.type === 'confirm') close(true);
        else if (dialog.type === 'prompt') close(promptValue);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog, promptValue, close]);

  useEffect(() => {
    if (dialog?.type === 'prompt') {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [dialog]);

  return (
    <DialogContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div
            key="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
            onClick={() => {
              if (dialog.type === 'alert') close(undefined);
              else if (dialog.type === 'confirm') close(false);
              else if (dialog.type === 'prompt') close(null);
              else if (dialog.type === 'choice') close(-1);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-[var(--shadow-lg)]"
            >
              <p className="text-lg text-text-primary mb-4 whitespace-pre-wrap">
                {dialog.message}
              </p>

              {dialog.type === 'prompt' && (
                <input
                  ref={inputRef}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={dialog.placeholder}
                  className="w-full px-3 py-2 rounded-lg bg-bg-primary outline-none mb-4 text-base"
                />
              )}

              <div className="flex gap-2 justify-end flex-wrap">
                {dialog.type === 'alert' && (
                  <button
                    onClick={() => close(undefined)}
                    className="px-4 py-2 rounded-xl bg-accent text-white font-bold cursor-pointer hover:brightness-110"
                  >
                    {dialog.okText ?? '확인'}
                  </button>
                )}
                {dialog.type === 'confirm' && (
                  <>
                    <button
                      onClick={() => close(false)}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-text-primary font-bold cursor-pointer hover:brightness-95"
                    >
                      {dialog.cancelText ?? '취소'}
                    </button>
                    <button
                      onClick={() => close(true)}
                      className="px-4 py-2 rounded-xl bg-accent text-white font-bold cursor-pointer hover:brightness-110"
                    >
                      {dialog.okText ?? '확인'}
                    </button>
                  </>
                )}
                {dialog.type === 'prompt' && (
                  <>
                    <button
                      onClick={() => close(null)}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-text-primary font-bold cursor-pointer hover:brightness-95"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => close(promptValue)}
                      className="px-4 py-2 rounded-xl bg-accent text-white font-bold cursor-pointer hover:brightness-110"
                    >
                      확인
                    </button>
                  </>
                )}
                {dialog.type === 'choice' && (
                  <>
                    {dialog.choices.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => close(i)}
                        className={`px-4 py-2 rounded-xl font-bold cursor-pointer hover:brightness-110 ${
                          i === 0 ? 'bg-accent text-white' : 'bg-bubble-5 text-text-primary'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    <button
                      onClick={() => close(-1)}
                      className="px-4 py-2 rounded-xl bg-gray-200 text-text-primary font-bold cursor-pointer hover:brightness-95"
                    >
                      취소
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useDialogs(): DialogContextType {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialogs must be used within DialogProvider');
  return ctx;
}
