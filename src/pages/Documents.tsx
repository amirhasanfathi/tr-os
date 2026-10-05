import { useEffect, useRef, useState } from 'react'
import { BookUser, Download, FileText, GraduationCap, Home, IdCard, Receipt, ShieldCheck, Upload } from 'lucide-react'
import { getDocuments, getDownloadUrl, uploadDocument, uploadDocumentFile } from '../services/documentService'
import type { Document, DocumentType } from '../types'
import { useI18n } from '../i18n'
import { useHttp } from '../config/runtime'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DocumentStatusBadge, StatusIcon } from '../components/ui/DocumentStatusBadge'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/PageHeader'
import { SampleDataBadge } from '../components/SampleDataBadge'

const iconMap: Record<string, typeof FileText> = {
  BookUser, IdCard, ShieldCheck, Home, Receipt, GraduationCap, FileText,
}

// Localized name per canonical document type (shared by mock and HTTP rows).
const nameKeyByType: Record<DocumentType, string> = {
  passport: 'documents.namePassport',
  residence: 'documents.nameResidence',
  insurance: 'documents.nameInsurance',
  rental_contract: 'documents.nameRental',
  tax: 'documents.nameTax',
  education: 'documents.nameEducation',
  cv: 'documents.nameCv',
  other: 'documents.nameOther',
}

export function Documents() {
  const { t, dir } = useI18n()
  const [docs, setDocs] = useState<Document[]>([])
  const [uploadTarget, setUploadTarget] = useState<Document | null>(null)
  const [pickedFile, setPickedFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getDocuments().then(setDocs)
  }, [])

  const ready = docs.filter((d) => d.status === 'ready').length
  const nameOf = (d: Document) => (nameKeyByType[d.type] ? t(nameKeyByType[d.type]) : d.name)

  function openUpload(target: Document | null) {
    setUploadTarget(target)
    setPickedFile(null)
  }

  async function confirmUpload() {
    if (!uploadTarget) return
    setBusy(true)
    try {
      if (useHttp) {
        if (!pickedFile) return
        setDocs(await uploadDocumentFile(uploadTarget.type, pickedFile))
      } else {
        setDocs(await uploadDocument(uploadTarget.id, 'uploaded-sample.pdf'))
      }
      setUploadTarget(null)
      setPickedFile(null)
    } finally {
      setBusy(false)
    }
  }

  async function download(d: Document) {
    const url = await getDownloadUrl(d.id)
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('documents.title')}
        subtitle={t('documents.subtitle')}
        action={<SampleDataBadge />}
      />

      <Card className={dir === 'rtl'
        ? 'flex flex-wrap items-center justify-between gap-3 bg-gradient-to-l from-white to-brand-50/40'
        : 'flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white to-brand-50/40'}>
        <div className="flex items-center gap-4">
          <div className="latin text-2xl font-extrabold text-brand-700">{ready}/{docs.length}</div>
          <div className="text-xs leading-5 text-ink-400">
            {t('documents.ready')}
            <br />
            {t('documents.needAction', { n: docs.length - ready })}
          </div>
        </div>
        <Button onClick={() => openUpload(docs[0] ?? null)}>
          <Upload size={14} /> {t('documents.uploadNew')}
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {docs.map((d) => {
          const Icon = iconMap[d.icon] ?? FileText
          return (
            <Card key={d.id} className="flex flex-col">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </span>
                <DocumentStatusBadge status={d.status} />
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-ink-900">{nameOf(d)}</h3>
              <div className="mt-2 space-y-1 text-[11px] text-ink-400">
                <div className="flex items-center justify-between">
                  <span>{t('documents.expiry')}</span>
                  <span className="latin font-bold text-ink-600">{d.expiryDate ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('documents.lastUpdate')}</span>
                  <span className="latin font-bold text-ink-600">{d.lastUpdated}</span>
                </div>
                {d.fileName && (
                  <div className="flex items-center justify-between">
                    <span>{t('documents.fileLbl')}</span>
                    <span className="latin flex items-center gap-1 font-semibold text-brand-600">
                      <StatusIcon status={d.status} /> {d.fileName}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-auto flex gap-2 pt-4">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => openUpload(d)}>
                  <Upload size={13} /> {t('documents.uploadReplace')}
                </Button>
                {useHttp && d.hasFile && (
                  <Button size="sm" variant="secondary" onClick={() => download(d)} aria-label={t('documents.download')}>
                    <Download size={13} />
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={!!uploadTarget}
        onClose={() => openUpload(null)}
        title={t('documents.uploadTitle', { name: uploadTarget ? nameOf(uploadTarget) : '' })}
      >
        <div className="space-y-4">
          <div
            className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50/50 text-ink-400 transition-colors hover:border-brand-300"
            onClick={() => useHttp && fileRef.current?.click()}
          >
            <Upload size={24} />
            <span className="latin max-w-full truncate px-4 text-xs font-semibold">
              {useHttp && pickedFile ? pickedFile.name : t('documents.dropHint')}
            </span>
            <span className="text-[10px] text-ink-300">{t('documents.formats')}</span>
          </div>

          {useHttp && (
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => setPickedFile(e.target.files?.[0] ?? null)}
            />
          )}

          <p className="rounded-xl bg-brand-50 p-3 text-[11px] leading-5 text-brand-800">
            {useHttp ? t('documents.realNote') : t('documents.simNote')}
          </p>

          <div className="flex gap-2">
            {useHttp ? (
              <Button className="flex-1" disabled={!pickedFile || busy} onClick={confirmUpload}>
                {busy ? t('documents.uploading') : t('documents.upload')}
              </Button>
            ) : (
              <Button className="flex-1" disabled={busy} onClick={confirmUpload}>
                {t('documents.simUpload')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => openUpload(null)}>{t('common.cancel')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
