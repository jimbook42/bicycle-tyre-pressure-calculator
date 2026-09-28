/** Neumorphic Soft UI class bundles (light + dark via `html.dark`). */

export const pageShell =
  'mx-auto min-h-screen max-w-[480px] px-4 pb-24 pt-6 antialiased transition-colors duration-300 bg-[#f3efe6] text-[#2b2825] dark:bg-[#121214] dark:text-[#e8e6e1]'

export const cardOuter =
  'rounded-[24px] bg-[#fdfaf3] shadow-[8px_8px_16px_rgba(0,0,0,0.08),_-8px_-8px_16px_rgba(255,255,255,0.7)] dark:bg-[#1e1e20] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_-8px_-8px_16px_rgba(255,255,255,0.05)]'

export const cardInner =
  'rounded-[20px] bg-[#f7f3eb] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),_inset_-4px_-4px_8px_rgba(255,255,255,0.7)] dark:bg-[#252529] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6),_inset_-4px_-4px_10px_rgba(255,255,255,0.05)]'

export const mutedText = 'text-[#5a5450] dark:text-[#a8a5a0]'

export const sectionTitle = 'text-[13px] font-semibold tracking-wide uppercase'

export const fieldClassName =
  'mt-1 w-full rounded-[12px] bg-[#f7f3eb] px-3 py-2.5 text-sm outline-none shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),_inset_-4px_-4px_8px_rgba(255,255,255,0.7)] dark:bg-[#252529] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6),_inset_-4px_-4px_10px_rgba(255,255,255,0.05)]'

export const btnRaised =
  'rounded-[14px] bg-[#fdfaf3] px-3 py-2 text-sm font-medium shadow-[8px_8px_16px_rgba(0,0,0,0.08),_-8px_-8px_16px_rgba(255,255,255,0.7)] transition hover:brightness-105 dark:bg-[#1e1e20] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_-8px_-8px_16px_rgba(255,255,255,0.05)]'

export const btnPrimary =
  'w-full rounded-[14px] bg-[#2b2825] px-4 py-3 text-sm font-semibold tracking-wide text-[#fdfaf3] shadow-[8px_8px_16px_rgba(0,0,0,0.12),_-4px_-4px_12px_rgba(255,255,255,0.4)] disabled:opacity-50 dark:bg-[#e8e6e1] dark:text-[#121214] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_-4px_-4px_12px_rgba(255,255,255,0.05)]'

export const pillActive =
  'rounded-[14px] bg-[#f7f3eb] py-2.5 text-[13px] font-medium text-[#2b2825] shadow-[inset_4px_4px_8px_rgba(0,0,0,0.08),_inset_-4px_-4px_8px_rgba(255,255,255,0.7)] dark:bg-[#252529] dark:text-[#e8e6e1] dark:shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6),_inset_-4px_-4px_10px_rgba(255,255,255,0.05)]'

export const pillIdle =
  `rounded-[14px] bg-[#fdfaf3] py-2.5 text-[13px] font-medium shadow-[8px_8px_16px_rgba(0,0,0,0.08),_-8px_-8px_16px_rgba(255,255,255,0.7)] ${mutedText} dark:bg-[#1e1e20] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),_-8px_-8px_16px_rgba(255,255,255,0.05)]`

export const resultCard = `${cardInner} p-4 flex flex-col items-center`

export const warnBox =
  'rounded-[12px] border border-[#f5c4a8] bg-[#ffefe5] p-2.5 text-[11px] text-[#8a4a2a] dark:border-[#5a3a2a] dark:bg-[#3a2a20] dark:text-[#e8b89a]'

export const successPanel = `${cardOuter} mt-6 p-5`
