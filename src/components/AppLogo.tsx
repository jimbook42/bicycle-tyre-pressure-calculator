interface AppLogoProps {
  className?: string
}

/** Brand mark — transparent PNG, no wrapper card. */
export function AppLogo({ className = 'h-11 w-11 shrink-0 object-contain' }: AppLogoProps) {
  return (
    <>
      <img
        src="/app-logo-light.png"
        alt=""
        className={`${className} dark:hidden`}
        width={44}
        height={44}
        decoding="async"
      />
      <img
        src="/app-logo-dark.png"
        alt=""
        className={`${className} hidden dark:block`}
        width={44}
        height={44}
        decoding="async"
      />
    </>
  )
}
