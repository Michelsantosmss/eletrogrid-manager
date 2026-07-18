import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Camera, QrCode, X } from 'lucide-react';
import type { Html5Qrcode } from 'html5-qrcode';

type Props = { onRead: (value: string) => void };

export function QrCodeScanner({ onRead }: Props) {
  const readerId = `qr-reader-${useId().replace(/:/g, '')}`;
  const scanner = useRef<Html5Qrcode | null>(null);
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [error, setError] = useState('');

  async function stopCamera() {
    const active = scanner.current;
    scanner.current = null;
    if (active?.isScanning) await active.stop().catch(() => undefined);
    active?.clear();
    setScanning(false);
  }

  useEffect(() => () => { void stopCamera(); }, []);

  async function startCamera() {
    setError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const instance = new Html5Qrcode(readerId);
      scanner.current = instance;
      setScanning(true);
      await instance.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (value) => { void finish(value); },
        () => undefined,
      );
    } catch {
      await stopCamera();
      setError('Não foi possível abrir a câmera. Autorize o acesso ou digite o código da etiqueta abaixo.');
    }
  }

  async function finish(value: string) {
    await stopCamera();
    setOpen(false);
    setManualValue('');
    onRead(value);
  }

  function submitManual(event: FormEvent) {
    event.preventDefault();
    const value = manualValue.trim();
    if (value) void finish(value);
  }

  async function close() {
    await stopCamera();
    setOpen(false);
    setError('');
  }

  return <>
    <button className="qr-scanner-button" onClick={() => setOpen(true)} type="button"><QrCode size={19}/>Ler QR Code</button>
    {open && <div className="qr-modal-backdrop" role="presentation">
      <section aria-labelledby="qr-reader-title" aria-modal="true" className="qr-modal" role="dialog">
        <div className="qr-modal-title"><div><span className="eyebrow">Identificar equipamento</span><h2 id="qr-reader-title">Leitor de QR Code</h2></div><button aria-label="Fechar leitor" className="qr-close" onClick={() => void close()} type="button"><X/></button></div>
        <p>Aponte a câmera para a etiqueta da OS. Ao reconhecer o código, a ordem será aberta automaticamente.</p>
        <div className="qr-reader-frame" id={readerId}/>
        {!scanning && <button onClick={() => void startCamera()} type="button"><Camera size={18}/>Ativar câmera</button>}
        {error && <strong className="form-error" role="alert">{error}</strong>}
        <form className="qr-manual-form" onSubmit={submitManual}>
          <label htmlFor={`${readerId}-manual`}>Ou digite o código da etiqueta</label>
          <div><input id={`${readerId}-manual`} onChange={(event) => setManualValue(event.target.value)} placeholder="Ex.: ELETROGRID|OS-000004|..." value={manualValue}/><button type="submit">Localizar OS</button></div>
        </form>
      </section>
    </div>}
  </>;
}
