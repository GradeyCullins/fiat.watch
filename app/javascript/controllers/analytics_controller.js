import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    eventName: String,
    params: Object,
    trackOnConnect: { type: Boolean, default: true }
  }

  connect() {
    if (this.trackOnConnectValue) this.track()
  }

  track() {
    if (!this.hasEventNameValue) return
    if (document.documentElement.hasAttribute("data-turbo-preview")) return
    if (typeof window.gtag !== "function") return

    window.gtag("event", this.eventNameValue, this.paramsValue || {})
  }
}
