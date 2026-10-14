import emailjs from '@emailjs/browser';
import { AlertCircle, ArrowDown, ArrowRight, Check, CircleCheck, LoaderCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contactMethods } from '../../models/PageContentConstants';
import { ContactMethod } from '../../models/PageKind';
import { PageText } from '../../models/PageText';

type ToastKind = 'error' | 'loading' | 'success';

interface ContactToast {
  kind: ToastKind;
  message: string;
}

export default function ContactPage() {
  const [toast, setToast] = useState<ContactToast | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [contactMethod, setContactMethod] = useState<ContactMethod>(ContactMethod.Phone);
  const [isContactMenuOpen, setIsContactMenuOpen] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const contactMethodRef = useRef<HTMLDivElement>(null);
  const contactMethodTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!toast || toast.kind === 'loading') return undefined;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!isContactMenuOpen) return undefined;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !contactMethodRef.current?.contains(event.target)) {
        setIsContactMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isContactMenuOpen]);

  function findInvalidFields(form: HTMLFormElement) {
    return Array.from(form.elements)
      .filter((element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
        element instanceof HTMLInputElement
        || element instanceof HTMLTextAreaElement
        || element instanceof HTMLSelectElement)
      .filter((element) => element.willValidate && !element.validity.valid)
      .map((element) => element.name);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const invalid = findInvalidFields(form);
    setInvalidFields(invalid);
    if (invalid.length > 0) {
      setToast({ kind: 'error', message: PageText.ValidationStatus });
      const firstInvalidField = form.elements.namedItem(invalid[0]);
      if (firstInvalidField instanceof HTMLElement) firstInvalidField.focus();
      return;
    }

    const { VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY } = import.meta.env;
    if (!VITE_EMAILJS_SERVICE_ID || !VITE_EMAILJS_TEMPLATE_ID || !VITE_EMAILJS_PUBLIC_KEY) {
      console.error(PageText.EmailConfigError);
      setToast({ kind: 'error', message: PageText.UnavailableStatus });
      return;
    }

    setIsSending(true);
    setToast({ kind: 'loading', message: PageText.SendingStatus });
    try {
      const formData = new FormData(form);
      const email = formData.get('email')?.toString() ?? '';
      await emailjs.send(
        VITE_EMAILJS_SERVICE_ID,
        VITE_EMAILJS_TEMPLATE_ID,
        {
          subject: PageText.EmailSubject,
          request_type: PageText.WebsiteRequestType,
          name: formData.get('name')?.toString() ?? '',
          email,
          reply_to: email,
          contact_method: contactMethod,
          contact_value: formData.get('contact_value')?.toString() ?? '',
          message: formData.get('message')?.toString() ?? '',
        },
        VITE_EMAILJS_PUBLIC_KEY,
      );
      form.reset();
      setContactMethod(ContactMethod.Phone);
      setInvalidFields([]);
      setToast({ kind: 'success', message: PageText.SuccessStatus });
    } catch (error) {
      console.error(PageText.EmailSendError, error);
      const serverError = typeof error === 'object'
        && error !== null
        && 'status' in error
        && typeof error.status === 'number'
        && error.status >= 400;
      setToast({
        kind: 'error',
        message: serverError ? PageText.ServerErrorStatus : PageText.FailureStatus,
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="content contact-content">
      <div className="contact-copy">
        <p className="eyebrow">{PageText.ContactEyebrowLabel}</p>
        <h2>{PageText.ContactHeadingFirst}<br /><em>{PageText.ContactHeadingAccent}</em></h2>
        <p className="contact-intro">{PageText.ContactIntro}</p>
        <div className="contact-assurances">
          <p><span><Check size={13} /></span>{PageText.AssuranceConsultation}</p>
          <p><span><Check size={13} /></span>{PageText.AssuranceNoHiddenFees}</p>
        </div>
      </div>
      <form
        className="contact-form glass-panel"
        noValidate
        onInput={(event) => {
          if (invalidFields.length > 0) {
            const nextInvalidFields = findInvalidFields(event.currentTarget);
            setInvalidFields(nextInvalidFields);
            if (nextInvalidFields.length === 0 && toast?.kind === 'error') setToast(null);
          }
        }}
        onSubmit={handleSubmit}
      >
        <label>
          {PageText.NameLabel}
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            placeholder={PageText.NamePlaceholder}
            aria-invalid={invalidFields.includes('name')}
          />
        </label>
        <div className="contact-method-field" ref={contactMethodRef}>
          <span className="contact-method-label" id="contact-method-label">{PageText.ContactMethodLabel}</span>
          <input type="hidden" name="contact_method" value={contactMethod} />
          <button
            className="contact-method-trigger"
            type="button"
            ref={contactMethodTriggerRef}
            aria-label={`${PageText.ContactMethodLabel} ${contactMethods.find((method) => method.value === contactMethod)?.label}`}
            aria-haspopup="listbox"
            aria-expanded={isContactMenuOpen}
            aria-controls="contact-method-options"
            onClick={() => setIsContactMenuOpen((open) => !open)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setIsContactMenuOpen(true);
              } else if (event.key === 'Escape') {
                setIsContactMenuOpen(false);
              }
            }}
          >
            {contactMethods.find((method) => method.value === contactMethod)?.label}
            <ArrowDown size={15} aria-hidden="true" />
          </button>
          {isContactMenuOpen && (
            <div
              className="contact-method-menu"
              id="contact-method-options"
              role="listbox"
              aria-labelledby="contact-method-label"
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsContactMenuOpen(false);
                  contactMethodTriggerRef.current?.focus();
                }
              }}
            >
              {contactMethods.map((method) => (
                <button
                  className="contact-method-option"
                  key={method.value}
                  type="button"
                  role="option"
                  aria-selected={contactMethod === method.value}
                  onClick={() => {
                    setContactMethod(method.value);
                    setIsContactMenuOpen(false);
                  }}
                >
                  {method.label}
                  {contactMethod === method.value && <Check size={14} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <label>
          {contactMethods.find((method) => method.value === contactMethod)?.label}
          <input
            name="contact_value"
            type={contactMethod === ContactMethod.Phone ? 'tel' : 'text'}
            autoComplete={contactMethod === ContactMethod.Phone ? 'tel' : 'off'}
            required
            maxLength={254}
            placeholder={contactMethod === ContactMethod.Phone ? PageText.ContactPhonePlaceholder : PageText.ContactSocialPlaceholder}
            aria-invalid={invalidFields.includes('contact_value')}
          />
        </label>
        <label>
          {PageText.OptionalEmailLabel}
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder={PageText.EmailPlaceholder}
            aria-invalid={invalidFields.includes('email')}
          />
        </label>
        <label>
          {PageText.BusinessLabel}
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={2000}
            rows={2}
            placeholder={PageText.MessagePlaceholder}
            aria-invalid={invalidFields.includes('message')}
          />
        </label>
        <div className="form-actions">
          <button className="primary-button submit-button" type="submit" disabled={isSending} aria-busy={isSending}>
            {isSending ? PageText.SendingButton : PageText.SubmitButton} <ArrowRight size={15} />
          </button>
        </div>
        <p className="privacy-note">{PageText.PrivacyNote}</p>
      </form>
      {toast && createPortal(
        <div className={`contact-toast is-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'} aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}>
          <span className="contact-toast-icon" aria-hidden="true">
            {toast.kind === 'success' && <CircleCheck size={19} />}
            {toast.kind === 'error' && <AlertCircle size={19} />}
            {toast.kind === 'loading' && <LoaderCircle className="is-spinning" size={19} />}
          </span>
          <span className="contact-toast-message">{toast.message}</span>
          {toast.kind !== 'loading' && (
            <button className="contact-toast-dismiss" type="button" aria-label={PageText.DismissNotification} onClick={() => setToast(null)}>
              <X size={16} />
            </button>
          )}
        </div>,
        document.body,
      )}
    </section>
  );
}
