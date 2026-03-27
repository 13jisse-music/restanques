// Gamepad API — support manette Bluetooth (Xbox, PS4, 8BitDo)
// Mapping standard: joystick gauche = mouvement, A = action, B = annuler

export interface GamepadState {
  connected: boolean
  axisX: number // -1 to 1
  axisY: number // -1 to 1
  btnA: boolean // button 0 (Xbox A, PS Cross)
  btnB: boolean // button 1 (Xbox B, PS Circle)
  dpadUp: boolean
  dpadDown: boolean
  dpadLeft: boolean
  dpadRight: boolean
}

const DEADZONE = 0.15

export function pollGamepad(): GamepadState | null {
  const gamepads = navigator.getGamepads?.()
  if (!gamepads) return null

  for (const gp of gamepads) {
    if (!gp || !gp.connected) continue

    let axisX = gp.axes[0] || 0
    let axisY = gp.axes[1] || 0

    // Apply deadzone
    if (Math.abs(axisX) < DEADZONE) axisX = 0
    if (Math.abs(axisY) < DEADZONE) axisY = 0

    return {
      connected: true,
      axisX,
      axisY,
      btnA: gp.buttons[0]?.pressed || false,
      btnB: gp.buttons[1]?.pressed || false,
      dpadUp: gp.buttons[12]?.pressed || false,
      dpadDown: gp.buttons[13]?.pressed || false,
      dpadLeft: gp.buttons[14]?.pressed || false,
      dpadRight: gp.buttons[15]?.pressed || false,
    }
  }
  return null
}

// Use in a requestAnimationFrame loop:
// const gp = pollGamepad()
// if (gp) { joyDXRef.current = gp.axisX; joyDYRef.current = gp.axisY; }
