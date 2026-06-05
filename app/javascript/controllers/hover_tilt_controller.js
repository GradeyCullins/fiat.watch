import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    max: { type: Number, default: 7 },
    lift: { type: Number, default: 4 },
    perspective: { type: Number, default: 700 },
    ignoreSelector: { type: String, default: "[data-hover-tilt-ignore]" }
  }

  connect() {
    this.reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    this.coarsePointerQuery = window.matchMedia("(pointer: coarse)")
    this.enabled = !this.reduceMotionQuery.matches && !this.coarsePointerQuery.matches
    this.baseTransform = window.getComputedStyle(this.element).transform
    this.frame = null
    this.suspended = false

    if (!this.enabled) return

    this.element.style.transformStyle = "preserve-3d"
    this.element.style.transition = "transform 180ms ease, box-shadow 180ms ease"
    this.element.style.willChange = "transform"
    this.element.addEventListener("pointerover", this.suspendForIgnoredTarget)
    this.element.addEventListener("pointerout", this.resumeFromIgnoredTarget)
    this.element.addEventListener("pointermove", this.tilt)
    this.element.addEventListener("pointerleave", this.reset)
    this.element.addEventListener("pointercancel", this.reset)
  }

  disconnect() {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.element.removeEventListener("pointerover", this.suspendForIgnoredTarget)
    this.element.removeEventListener("pointerout", this.resumeFromIgnoredTarget)
    this.element.removeEventListener("pointermove", this.tilt)
    this.element.removeEventListener("pointerleave", this.reset)
    this.element.removeEventListener("pointercancel", this.reset)
    this.element.style.transform = this.initialTransform
    this.element.style.willChange = ""
  }

  tilt = (event) => {
    if (!this.enabled) return

    if (this.suspended || this.ignoredElementFor(event.target)) {
      return
    }

    const rect = this.element.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    const rotateX = y * this.maxValue * -1
    const rotateY = x * this.maxValue

    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => {
      this.element.style.transition = "transform 80ms ease-out, box-shadow 120ms ease-out"
      this.element.style.transform = [
        this.initialTransform,
        `perspective(${this.perspectiveValue}px)`,
        `translate3d(0, -${this.liftValue}px, 0)`,
        `rotateX(${rotateX}deg)`,
        `rotateY(${rotateY}deg)`
      ].filter(Boolean).join(" ")
    })
  }

  reset = () => {
    this.suspended = false

    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame(() => {
      this.element.style.transition = "transform 220ms ease, box-shadow 180ms ease"
      this.element.style.transform = this.initialTransform
    })
  }

  suspendForIgnoredTarget = (event) => {
    if (this.ignoredElementFor(event.target)) {
      this.suspended = true
    }
  }

  resumeFromIgnoredTarget = (event) => {
    if (!this.ignoredElementFor(event.target)) return
    if (this.ignoredElementFor(event.relatedTarget)) return

    this.suspended = false
  }

  ignoredElementFor(target) {
    if (!(target instanceof Element)) return null

    const ignoredElement = target.closest(this.ignoreSelectorValue)
    if (!ignoredElement || !this.element.contains(ignoredElement)) return null

    return ignoredElement
  }

  get initialTransform() {
    return this.baseTransform === "none" ? "" : this.baseTransform
  }
}
