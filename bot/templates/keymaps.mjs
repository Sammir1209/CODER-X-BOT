import { OWNER_1_LINK, OWNER_2_LINK } from '../config/constants.mjs';

export function getNoPlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔹 COMPRAR PLAN | @S_14xx 🔹', url: OWNER_1_LINK },
        ],
        [
          { text: '🔹 COMPRAR PLAN | @mrcodexofc 🔹', url: OWNER_2_LINK },
        ],
        [
          { text: '👤 MI PERFIL / ESTADO', callback_data: 'check_profile' },
        ],
      ],
    },
  };
}

export function getActivePlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📦 DESCARGAR EXTENSIÓN VIP (.ZIP)', callback_data: 'get_extension' },
        ],
        [
          { text: '👑 OWNER | @S_14xx', url: OWNER_1_LINK },
          { text: '👑 OWNER | @mrcodexofc', url: OWNER_2_LINK },
        ],
        [
          { text: '👤 MI PERFIL / ESTADO', callback_data: 'check_profile' },
        ],
      ],
    },
  };
}
