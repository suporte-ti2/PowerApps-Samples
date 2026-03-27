import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class IFrameControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private _container: HTMLDivElement;
  private _iframe!: HTMLIFrameElement;
  private _placeholder!: HTMLDivElement;

  private _rendered = false;
  private _lastUrl: string | null = null;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this._container = container;
    this._rendered = false;
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    if (!this._rendered) {
      this._rendered = true;
      this.render();
    }

    // Ajusta tamanho para preencher o espaço do controle
    this.resizeToAllocatedSpace(context);

    // Lê URL do manifest (url)
    const rawUrl = (context.parameters.url.raw ?? "").trim();

    // Se vazio → mostra placeholder, limpa iframe
    if (!rawUrl) {
      this.setPlaceholder(true, "Informe uma URL para exibir no iframe.");
      this.setIframeSrc("about:blank");
      this._lastUrl = null;
      return;
    }

    // Validação mínima: só http/https (evita javascript:, data:, etc.)
    const safeUrl = this.normalizeAndValidateUrl(rawUrl);
    if (!safeUrl) {
      this.setPlaceholder(true, "URL inválida. Use http:// ou https://");
      this.setIframeSrc("about:blank");
      this._lastUrl = null;
      return;
    }

    // Só atualiza se mudou
    if (safeUrl !== this._lastUrl) {
      this._lastUrl = safeUrl;
      this.setPlaceholder(false);
      this.setIframeSrc(safeUrl);
    }
  }

  private render(): void {
    // Container
    this._container.classList.add("SampleControl_Container");

    // Placeholder (mensagens)
    this._placeholder = document.createElement("div");
    this._placeholder.className = "SampleControl_Placeholder";
    this._placeholder.innerText = "Carregando...";
    this._container.appendChild(this._placeholder);

    // IFrame
    this._iframe = document.createElement("iframe");
    this._iframe.className = "SampleControl_IFrame";
    this._iframe.setAttribute("src", "about:blank");

    // Boas práticas para embed
    this._iframe.setAttribute("loading", "lazy");
    this._iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

    // Power BI gosta de fullscreen
    this._iframe.setAttribute("allowfullscreen", "true");
    this._iframe.setAttribute("allow", "fullscreen");

    // Evita bordas
    this._iframe.setAttribute("frameborder", "0");

    this._container.appendChild(this._iframe);

    // Placeholder inicial
    this.setPlaceholder(true, "Informe uma URL para exibir no iframe.");
  }

  private resizeToAllocatedSpace(context: ComponentFramework.Context<IInputs>): void {
    // allocatedWidth/Height são a forma correta de pegar o tamanho disponível no host (Canvas/Teams)
    const w = Math.max(0, Math.floor(context.mode.allocatedWidth || 0));
    const h = Math.max(0, Math.floor(context.mode.allocatedHeight || 0));

    if (w > 0) this._container.style.width = `${w}px`;
    if (h > 0) this._container.style.height = `${h}px`;
  }

  private normalizeAndValidateUrl(url: string): string | null {
    try {
      // Se o usuário passar sem protocolo, você pode optar por completar.
      // Aqui eu NÃO completo automaticamente (pra evitar surpresas).
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      return parsed.toString();
    } catch {
      return null;
    }
  }

  private setIframeSrc(src: string): void {
    // Evita reflow desnecessário
    if (this._iframe.getAttribute("src") !== src) {
      this._iframe.setAttribute("src", src);
    }
  }

  private setPlaceholder(visible: boolean, text?: string): void {
    this._placeholder.style.display = visible ? "flex" : "none";
    if (text !== undefined) this._placeholder.innerText = text;
    this._iframe.style.display = visible ? "none" : "block";
  }

  public getOutputs(): IOutputs {
    return {};
  }

  public destroy(): void {
    // nada a limpar neste caso
  }
}