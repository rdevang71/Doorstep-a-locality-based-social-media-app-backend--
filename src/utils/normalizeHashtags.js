export default function normalizeHashtags(input = []) {
  const values = Array.isArray(input) ? input : String(input).split(/[\s,]+/);
  return [
    ...new Set(
      values
        .map((tag) => String(tag).trim().replace(/^#+/, "").toLowerCase())
        .filter((tag) => /^[\p{L}\p{N}_-]{1,40}$/u.test(tag)),
    ),
  ];
}
