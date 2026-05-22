import { Template } from './types';

export const videoTemplates: Template[] = [
  {
    id: 'cinematic',
    name: 'سينمائي',
    description: 'مونتاج سينمائي بطيء مع مؤثرات أنيقة',
    transitions: ['fade', 'dissolve', 'zoom_in'],
    effects: ['brightness', 'contrast', 'saturate'],
    musicGenre: 'cinematic',
    pacing: 'slow',
  },
  {
    id: 'modern',
    name: 'عصري سريع',
    description: 'مونتاج سريع مع ترانزيشن ديناميكي مناسب للسوشيال ميديا',
    transitions: ['slide_left', 'slide_right', 'zoom_out', 'wipe'],
    effects: ['brightness', 'contrast', 'saturate', 'sharpen'],
    musicGenre: 'electronic',
    pacing: 'fast',
  },
  {
    id: 'vlog',
    name: 'فلوق',
    description: 'مونتاج ناعم وطبيعي مناسب للفلوقات واليوميات',
    transitions: ['fade', 'dissolve'],
    effects: ['brightness', 'saturate'],
    musicGenre: 'lofi',
    pacing: 'medium',
  },
  {
    id: 'promo',
    name: 'برومو / إعلان',
    description: 'مونتاج إعلاني يجذب الانتباه مع تأثيرات جرافيك',
    transitions: ['slide_left', 'slide_right', 'zoom_in', 'zoom_out'],
    effects: ['brightness', 'contrast', 'saturate', 'sharpen', 'vignette'],
    musicGenre: 'upbeat',
    pacing: 'fast',
  },
  {
    id: 'travel',
    name: 'سفر ومغامرات',
    description: 'مونتاج دافئ للسفر والمغامرات مع ألوان زاهية',
    transitions: ['dissolve', 'fade', 'zoom_in'],
    effects: ['brightness', 'saturate', 'contrast', 'vignette'],
    musicGenre: 'acoustic',
    pacing: 'medium',
  },
  {
    id: 'retro',
    name: 'ريترو / نستالجيا',
    description: 'مونتاج حنين مع تأثيرات عفا عليها الزمن',
    transitions: ['fade', 'dissolve', 'wipe'],
    effects: ['grayscale', 'sepia', 'vignette', 'blur'],
    musicGenre: 'jazz',
    pacing: 'slow',
  },
  {
    id: 'gaming',
    name: 'قيمنج',
    description: 'مونتاج قوي وسريع مناسب لمقاطع الألعاب',
    transitions: ['slide_left', 'slide_right', 'zoom_in', 'zoom_out'],
    effects: ['brightness', 'contrast', 'saturate', 'sharpen'],
    musicGenre: 'electronic',
    pacing: 'fast',
  },
  {
    id: 'wedding',
    name: 'زفاف',
    description: 'مونتاج رومانسي ناعم مناسب لحفلات الزفاف',
    transitions: ['fade', 'dissolve', 'zoom_in'],
    effects: ['brightness', 'saturate', 'blur'],
    musicGenre: 'piano',
    pacing: 'slow',
  },
];

export function getTemplateById(id: string): Template | undefined {
  return videoTemplates.find(t => t.id === id);
}
