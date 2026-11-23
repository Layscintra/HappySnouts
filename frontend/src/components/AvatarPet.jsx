import { useState } from "react";
import { urlImagem } from "../lib/api.js";

export default function AvatarPet({ pet, tamanho = 30, className = "cal-av" }) {
  const [erro, setErro] = useState(false);
  const foto = pet?.foto_url ? urlImagem(pet.foto_url) : "";
  return (
    <span className={className} style={{ width: tamanho, height: tamanho }} aria-hidden="true">
      {foto && !erro ? (
        <img src={foto} alt="" onError={() => setErro(true)} />
      ) : (
        (pet?.nome_pet || "?")[0].toUpperCase()
      )}
    </span>
  );
}
