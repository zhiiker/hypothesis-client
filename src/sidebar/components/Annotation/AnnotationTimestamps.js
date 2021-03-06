import { useEffect, useMemo, useState } from 'preact/hooks';

import { format as formatDate } from '../../util/date';
import { decayingInterval, toFuzzyString } from '../../util/time';

/**
 * @typedef {import("../../../types/api").Annotation} Annotation
 */

/**
 * @typedef AnnotationTimestampsProps
 * @prop {string} annotationCreated
 * @prop {string} annotationUpdated
 * @prop {string} [annotationUrl]
 * @prop {boolean} [withEditedTimestamp] - Should a timestamp for when this
 *   annotation was last edited be rendered?
 */

/**
 * Render textual timestamp information for an annotation. This includes
 * a relative date string (e.g. "5 hours ago") for the annotation's creation,
 * and, if `withEditedTimestamp` is `true`, a relative date string for when it
 * was last edited. If the `annotation` has an HTML link, the created-date
 * timestamp will be linked to that URL (the single-annotation view
 * for this annotation).
 *
 * @param {AnnotationTimestampsProps} props
 */
export default function AnnotationTimestamps({
  annotationCreated,
  annotationUpdated,
  annotationUrl,
  withEditedTimestamp,
}) {
  // "Current" time, used when calculating the relative age of `timestamp`.
  const [now, setNow] = useState(() => new Date());
  const createdDate = useMemo(() => new Date(annotationCreated), [
    annotationCreated,
  ]);
  const updatedDate = useMemo(
    () => withEditedTimestamp && new Date(annotationUpdated),
    [annotationUpdated, withEditedTimestamp]
  );

  const created = useMemo(() => {
    return {
      absolute: formatDate(createdDate),
      relative: toFuzzyString(createdDate, now),
    };
  }, [createdDate, now]);

  const updated = useMemo(() => {
    if (!updatedDate) {
      return {};
    }
    return {
      absolute: formatDate(updatedDate),
      relative: toFuzzyString(updatedDate, now),
    };
  }, [updatedDate, now]);

  // Refresh relative timestamp, at a frequency appropriate for the age.
  useEffect(() => {
    // Determine which of the two Dates to use for the `decayingInterval`
    // It should be the latest relevant date, as the interval will be
    // shorter the closer the date is to "now"
    const laterDate = updatedDate ? annotationUpdated : annotationCreated;
    const cancelRefresh = decayingInterval(laterDate, () => setNow(new Date()));
    return cancelRefresh;
  }, [annotationCreated, annotationUpdated, createdDate, updatedDate, now]);

  // Do not show the relative timestamp for the edited date if it is the same
  // as the relative timestamp for the created date
  const editedString =
    updated && updated.relative !== created.relative
      ? `edited ${updated.relative}`
      : 'edited';

  return (
    <div className="AnnotationTimestamps">
      {withEditedTimestamp && (
        <span
          className="AnnotationTimestamps__timestamp AnnotationTimestamps__edited"
          title={updated.absolute}
        >
          ({editedString}){' '}
        </span>
      )}
      {annotationUrl ? (
        <a
          className="AnnotationTimestamps__timestamp AnnotationTimestamps__timestamp--linked"
          target="_blank"
          rel="noopener noreferrer"
          title={created.absolute}
          href={annotationUrl}
        >
          {created.relative}
        </a>
      ) : (
        <span
          className="AnnotationTimestamps__timestamp AnnotationTimestamps__created"
          title={created.absolute}
        >
          {created.relative}
        </span>
      )}
    </div>
  );
}
