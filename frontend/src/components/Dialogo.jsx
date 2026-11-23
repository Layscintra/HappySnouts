import { useEffect, useRef } from "react";

// <dialog> nativo controlado pelo React: abre com showModal() quando "aberto" fica true,
// fecha clicando fora, no Esc ou em qualquer botão com data-close.
// aoAbrir recebe o elemento do diálogo (para focar o primeiro campo, por exemplo).
export default function Dialogo({ aberto, aoFechar, aoAbrir, children, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (aberto && !d.open) {
      d.showModal();
      aoAbrir?.(d);
    }
    if (!aberto && d.open) d.close();
  }, [aberto]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <dialog
      {...props}
      ref={ref}
      onClose={aoFechar}
      onClick={e => {
        if (e.target === ref.current || e.target.closest("[data-close]")) ref.current.close();
      }}
    >
      {children}
    </dialog>
  );
}

export const focarPrimeiroCampo = d =>
  d.querySelector("form:not([hidden]) input:not([type=file]), form:not([hidden]) select")?.focus();
