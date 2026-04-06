import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { WidgetElementComponent } from './app/widget/widget-element.component';

(async () => {
  const app = await createApplication({
    providers: [provideHttpClient(withFetch())],
  });

  const WidgetElement = createCustomElement(WidgetElementComponent, {
    injector: app.injector,
  });

  customElements.define('ai-chat-widget', WidgetElement);

  // Auto-initialize from <script data-api-key="..."> if no manual element exists
  const currentScript = document.currentScript as HTMLScriptElement | null;
  if (currentScript) {
    const apiKey = currentScript.getAttribute('data-api-key');
    if (apiKey && !document.querySelector('ai-chat-widget')) {
      const widget = document.createElement('ai-chat-widget');
      widget.setAttribute('api-key', apiKey);

      const apiUrl = currentScript.getAttribute('data-api-url');
      if (apiUrl) widget.setAttribute('api-url', apiUrl);

      document.body.appendChild(widget);
    }
  }
})();
