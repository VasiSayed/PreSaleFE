import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";

/* ---------------- helpers ---------------- */
const safeArr = (v) => (Array.isArray(v) ? v : []);
const fmtDT = (v) => {
  if (!v) return "-";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(v);
  }
};

function Card({ title, children, right }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 14,
        padding: 14,
        background: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 14 }}>{title}</div>
        {right}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

/* =========================
   CLIENT: NOTICES (default route)
========================= */
export function Notices() {
  const { projectId } = useOutletContext();
  const [rows, setRows] = useState([]);

  const load = async () => {
    if (!projectId) return;
    try {
      const res = await axiosInstance.get(
        `/communications/notices/?project_id=${projectId}`,
      );
      setRows(safeArr(res?.data));
    } catch {
      toast.error("Failed to load notices");
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const sorted = useMemo(() => {
    const xs = [...rows];
    xs.sort((a, b) => Number(!!b.is_pinned) - Number(!!a.is_pinned));
    return xs;
  }, [rows]);

  return (
    <Card title="Notices" right={<button onClick={load}>Refresh</button>}>
      {!projectId ? (
        <div style={{ opacity: 0.7 }}>Select project.</div>
      ) : sorted.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No notices.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((n) => (
            <Link
              key={n.id}
              to={`notices/${n.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                display: "block",
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {n.title}{" "}
                {n.is_pinned ? (
                  <span style={{ fontSize: 12, opacity: 0.7 }}>(Pinned)</span>
                ) : null}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {n.priority} • publish: {fmtDT(n.publish_at)} • expires:{" "}
                {fmtDT(n.expires_at)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function NoticeDetail() {
  const { projectId } = useOutletContext();
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState(null);
  const [acking, setAcking] = useState(false);

  const load = async () => {
    if (!projectId || !id) return;
    try {
      const res = await axiosInstance.get(
        `/communications/notices/${id}/?project_id=${projectId}`,
      );
      setRow(res?.data || null);
    } catch (e) {
      toast.error("Failed to load notice");
    }
  };

  useEffect(() => {
    load();
  }, [projectId, id]);

  const ack = async () => {
    if (!projectId || !id) return;
    setAcking(true);
    try {
      await axiosInstance.post(
        `/communications/notices/${id}/ack/?project_id=${projectId}`,
        {},
      );
      toast.success("Acknowledged");
      await load();
    } catch {
      toast.error("Ack failed");
    } finally {
      setAcking(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <button onClick={() => nav(-1)}>← Back</button>

      <Card
        title={row?.title || "Notice"}
        right={
          row?.requires_ack ? (
            <button onClick={ack} disabled={acking}>
              {acking ? "Acking..." : "Acknowledge"}
            </button>
          ) : null
        }
      >
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {row?.priority} • created: {fmtDT(row?.created_at)}
        </div>
        <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
          {row?.body || "-"}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Attachments</div>
          {safeArr(row?.attachments).length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>No attachments.</div>
          ) : (
            safeArr(row?.attachments).map((a) => (
              <div key={a.id} style={{ fontSize: 12, marginTop: 6 }}>
                {a.name || `Attachment #${a.id}`} —{" "}
                <span style={{ opacity: 0.75 }}>{a.file}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

/* =========================
   CLIENT: EVENTS
========================= */
export function Events() {
  const { projectId } = useOutletContext();
  const [rows, setRows] = useState([]);

  const load = async () => {
    if (!projectId) return;
    try {
      const res = await axiosInstance.get(
        `/communications/events/?project_id=${projectId}`,
      );
      setRows(safeArr(res?.data));
    } catch {
      toast.error("Failed to load events");
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <Card title="Events" right={<button onClick={load}>Refresh</button>}>
      {rows.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No events.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((e) => (
            <Link
              key={e.id}
              to={`events/${e.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                display: "block",
              }}
            >
              <div style={{ fontWeight: 800 }}>{e.title}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {fmtDT(e.start_at)} → {fmtDT(e.end_at)} • RSVP:{" "}
                {String(!!e.requires_rsvp)} • Checkin:{" "}
                {String(!!e.requires_checkin)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function EventDetail() {
  const { projectId } = useOutletContext();
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState(null);

  const [rsvpStatus, setRsvpStatus] = useState("MAYBE");
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const [sessionCode, setSessionCode] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);

  const load = async () => {
    if (!projectId || !id) return;
    try {
      const res = await axiosInstance.get(
        `/communications/events/${id}/?project_id=${projectId}`,
      );
      setRow(res?.data || null);
    } catch {
      toast.error("Failed to load event");
    }
  };

  useEffect(() => {
    load();
  }, [projectId, id]);

  const rsvp = async (status) => {
    setRsvpStatus(status);
    setRsvpLoading(true);
    try {
      await axiosInstance.post(
        `/communications/events/${id}/rsvp/?project_id=${projectId}`,
        { status },
      );
      toast.success("RSVP updated");
    } catch {
      toast.error("RSVP failed");
    } finally {
      setRsvpLoading(false);
    }
  };

  const checkinScan = async () => {
    if (!sessionCode.trim()) return toast.error("session_code required");
    setCheckinLoading(true);
    try {
      await axiosInstance.post(`/communications/events/checkin_scan/`, {
        project_id: Number(projectId),
        session_code: sessionCode.trim(),
      });
      toast.success("Checked-in ✅");
      setSessionCode("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Check-in failed");
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <button onClick={() => nav(-1)}>← Back</button>

      <Card title={row?.title || "Event"}>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          {fmtDT(row?.start_at)} → {fmtDT(row?.end_at)} •{" "}
          {row?.location_text || ""}
        </div>

        <div style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
          {row?.description || "-"}
        </div>

        {row?.requires_rsvp ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>RSVP</div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              <button onClick={() => rsvp("YES")} disabled={rsvpLoading}>
                YES
              </button>
              <button onClick={() => rsvp("NO")} disabled={rsvpLoading}>
                NO
              </button>
              <button onClick={() => rsvp("MAYBE")} disabled={rsvpLoading}>
                MAYBE
              </button>
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                Current: {rsvpStatus}
              </span>
            </div>
          </div>
        ) : null}

        {row?.requires_checkin ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Check-in</div>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 6,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder="Enter session_code from QR"
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.16)",
                }}
              />
              <button onClick={checkinScan} disabled={checkinLoading}>
                {checkinLoading ? "Checking..." : "Check-in"}
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 13 }}>Attachments</div>
          {safeArr(row?.attachments).length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 12 }}>No attachments.</div>
          ) : (
            safeArr(row?.attachments).map((a) => (
              <div key={a.id} style={{ fontSize: 12, marginTop: 6 }}>
                {a.name || `Attachment #${a.id}`} —{" "}
                <span style={{ opacity: 0.75 }}>{a.file}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

/* =========================
   CLIENT: FORUM (feed)
========================= */
export function Forum() {
  const { projectId } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [reactingId, setReactingId] = useState(null);

  const load = async () => {
    if (!projectId) return;
    try {
      const res = await axiosInstance.get(
        `/communications/forum-posts/?project_id=${projectId}`,
      );
      setRows(safeArr(res?.data));
    } catch {
      toast.error("Failed to load forum");
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const react = async (postId, kind = "LIKE") => {
    setReactingId(postId);
    try {
      await axiosInstance.post(
        `/communications/forum-posts/${postId}/react/?project_id=${projectId}`,
        { kind },
      );
      toast.success("Reacted");
    } catch {
      toast.error("React failed");
    } finally {
      setReactingId(null);
    }
  };

  const share = async (postId) => {
    try {
      await axiosInstance.post(
        `/communications/forum-posts/${postId}/share/?project_id=${projectId}`,
        {},
      );
      toast.success("Shared");
    } catch {
      toast.error("Share failed");
    }
  };

  return (
    <Card title="Forum" right={<button onClick={load}>Refresh</button>}>
      {rows.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No posts.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((p) => (
            <div
              key={p.id}
              style={{
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
              }}
            >
              <div style={{ fontWeight: 800 }}>{p.title || "Post"}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {fmtDT(p.created_at)} • id: {p.id}
              </div>
              <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {p.content}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => react(p.id, "LIKE")}
                  disabled={reactingId === p.id}
                >
                  Like
                </button>
                <button onClick={() => share(p.id)}>Share</button>
              </div>

              <CommentBox projectId={projectId} postId={p.id} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CommentBox({ projectId, postId }) {
  const [text, setText] = useState("");
  const [localComments, setLocalComments] = useState([]);

  const submit = async () => {
    if (!text.trim()) return;
    try {
      const res = await axiosInstance.post(
        `/communications/forum-posts/${postId}/comment/?project_id=${projectId}`,
        {
          text: text.trim(),
        },
      );
      setLocalComments((prev) => [res?.data, ...prev]);
      setText("");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Comment failed");
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.16)",
          }}
        />
        <button onClick={submit}>Send</button>
      </div>

      {localComments.length ? (
        <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
          {localComments.map((c) => (
            <div key={c.id} style={{ fontSize: 12, opacity: 0.9 }}>
              <b>User:</b> {c.user} — {c.text}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   CLIENT: POLLS
========================= */
export function Polls() {
  const { projectId } = useOutletContext();
  const [rows, setRows] = useState([]);
  const [votingId, setVotingId] = useState(null);

  const load = async () => {
    if (!projectId) return;
    try {
      const res = await axiosInstance.get(
        `/communications/polls/?project_id=${projectId}`,
      );
      setRows(safeArr(res?.data));
    } catch {
      toast.error("Failed to load polls");
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const vote = async (poll, optionIds) => {
    setVotingId(poll.id);
    try {
      await axiosInstance.post(
        `/communications/polls/${poll.id}/vote/?project_id=${projectId}`,
        poll.allow_multi_select
          ? { option_ids: optionIds }
          : { option_id: optionIds[0] },
      );
      toast.success("Voted ✅");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Vote failed");
    } finally {
      setVotingId(null);
    }
  };

  return (
    <Card title="Polls" right={<button onClick={load}>Refresh</button>}>
      {rows.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No polls.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((p) => (
            <PollCard
              key={p.id}
              poll={p}
              onVote={vote}
              voting={votingId === p.id}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function PollCard({ poll, onVote, voting }) {
  const options = safeArr(poll.options);
  const [selected, setSelected] = useState([]);

  const toggle = (id) => {
    const set = new Set(selected.map(Number));
    if (set.has(Number(id))) set.delete(Number(id));
    else set.add(Number(id));
    setSelected(Array.from(set));
  };

  const pickSingle = (id) => setSelected([Number(id)]);

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.10)",
      }}
    >
      <div style={{ fontWeight: 800 }}>{poll.question}</div>
      {poll.description ? (
        <div style={{ fontSize: 12, opacity: 0.8 }}>{poll.description}</div>
      ) : null}

      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
        {options.map((o) => (
          <label
            key={o.id}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              fontSize: 13,
            }}
          >
            <input
              type={poll.allow_multi_select ? "checkbox" : "radio"}
              checked={selected.includes(o.id)}
              onChange={() =>
                poll.allow_multi_select ? toggle(o.id) : pickSingle(o.id)
              }
              name={`poll_${poll.id}`}
            />
            {o.text}
          </label>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => onVote(poll, selected)}
          disabled={voting || selected.length === 0}
        >
          {voting ? "Submitting..." : "Submit Vote"}
        </button>
      </div>
    </div>
  );
}

/* =========================
   CLIENT: SURVEYS
========================= */
export function Surveys() {
  const { projectId } = useOutletContext();
  const [rows, setRows] = useState([]);

  const load = async () => {
    if (!projectId) return;
    try {
      const res = await axiosInstance.get(
        `/communications/surveys/?project_id=${projectId}`,
      );
      setRows(safeArr(res?.data));
    } catch {
      toast.error("Failed to load surveys");
    }
  };

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <Card title="Surveys" right={<button onClick={load}>Refresh</button>}>
      {rows.length === 0 ? (
        <div style={{ opacity: 0.7 }}>No surveys.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((s) => (
            <Link
              key={s.id}
              to={`surveys/${s.id}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                padding: 10,
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                display: "block",
              }}
            >
              <div style={{ fontWeight: 800 }}>{s.title}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                sections: {safeArr(s.sections).length} • questions:{" "}
                {safeArr(s.questions).length} • id: {s.id}
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

export function SurveyFill() {
  const { projectId } = useOutletContext();
  const { id } = useParams();
  const nav = useNavigate();

  const [survey, setSurvey] = useState(null);
  const [responseId, setResponseId] = useState(null);
  const [loading, setLoading] = useState(true);

  // answers state: questionId -> { type, value }
  const [answers, setAnswers] = useState({});

  const loadSurvey = async () => {
    if (!projectId || !id) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/communications/surveys/${id}/?project_id=${projectId}`,
      );
      setSurvey(res?.data || null);
    } catch {
      toast.error("Failed to load survey");
      setSurvey(null);
    } finally {
      setLoading(false);
    }
  };

  const start = async () => {
    if (!projectId || !id) return;
    try {
      const res = await axiosInstance.post(
        `/communications/surveys/${id}/start/?project_id=${projectId}`,
        {},
      );
      setResponseId(res?.data?.id || null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Start failed");
    }
  };

  useEffect(() => {
    loadSurvey();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, id]);

  useEffect(() => {
    if (survey && !responseId) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [survey]);

  const questions = safeArr(survey?.questions);

  const setAns = (qid, v) => setAnswers((prev) => ({ ...prev, [qid]: v }));

  const submit = async () => {
    if (!responseId)
      return toast.error("response_id missing. Please reopen survey.");
    const payloadAnswers = [];

    for (const q of questions) {
      const qid = q.id;
      const state = answers[qid];
      if (!state) continue;

      // MULTI => multiple rows
      if (q.qtype === "MULTI") {
        const optionIds = safeArr(state.option_ids);
        optionIds.forEach((oid) =>
          payloadAnswers.push({ question_id: qid, option_id: oid }),
        );
        continue;
      }

      if (q.qtype === "SINGLE") {
        if (state.option_id)
          payloadAnswers.push({ question_id: qid, option_id: state.option_id });
        continue;
      }

      if (q.qtype === "TEXT") {
        if (state.text_value)
          payloadAnswers.push({
            question_id: qid,
            text_value: state.text_value,
          });
        continue;
      }

      if (q.qtype === "NUMBER" || q.qtype === "RATING") {
        if (
          state.number_value !== "" &&
          state.number_value !== null &&
          state.number_value !== undefined
        ) {
          payloadAnswers.push({
            question_id: qid,
            number_value: Number(state.number_value),
          });
        }
        continue;
      }

      if (q.qtype === "DATE") {
        if (state.date_value)
          payloadAnswers.push({
            question_id: qid,
            date_value: state.date_value,
          });
        continue;
      }

      if (q.qtype === "YESNO") {
        if (typeof state.text_value === "string")
          payloadAnswers.push({
            question_id: qid,
            text_value: state.text_value,
          });
        continue;
      }
    }

    try {
      await axiosInstance.post(
        `/communications/surveys/${id}/submit/?project_id=${projectId}`,
        {
          response_id: responseId,
          answers: payloadAnswers,
        },
      );
      toast.success("Submitted ✅");
      nav(-1);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Submit failed");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 12 }}>
        <button onClick={() => nav(-1)}>← Back</button>
        <div style={{ marginTop: 10 }}>Loading survey...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <button onClick={() => nav(-1)}>← Back</button>

      <Card
        title={survey?.title || "Survey"}
        right={<button onClick={submit}>Submit</button>}
      >
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          response_id: {responseId || "-"}
        </div>
        {survey?.description ? (
          <div style={{ marginTop: 10 }}>{survey.description}</div>
        ) : null}

        <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
          {questions.map((q) => (
            <QuestionRenderer
              key={q.id}
              q={q}
              value={answers[q.id]}
              onChange={(v) => setAns(q.id, v)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function QuestionRenderer({ q, value, onChange }) {
  const opts = safeArr(q.options);

  if (q.qtype === "TEXT") {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <textarea
          value={value?.text_value || ""}
          onChange={(e) => onChange({ text_value: e.target.value })}
          rows={3}
          style={{
            width: "100%",
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.16)",
          }}
        />
      </div>
    );
  }

  if (q.qtype === "NUMBER") {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <input
          type="number"
          value={value?.number_value ?? ""}
          onChange={(e) => onChange({ number_value: e.target.value })}
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.16)",
          }}
        />
      </div>
    );
  }

  if (q.qtype === "DATE") {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <input
          type="date"
          value={value?.date_value || ""}
          onChange={(e) => onChange({ date_value: e.target.value })}
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.16)",
          }}
        />
      </div>
    );
  }

  if (q.qtype === "YESNO") {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              checked={value?.text_value === "YES"}
              onChange={() => onChange({ text_value: "YES" })}
              name={`yesno_${q.id}`}
            />
            YES
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="radio"
              checked={value?.text_value === "NO"}
              onChange={() => onChange({ text_value: "NO" })}
              name={`yesno_${q.id}`}
            />
            NO
          </label>
        </div>
      </div>
    );
  }

  if (q.qtype === "RATING") {
    const max = Number(q.rating_max || 5);
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <select
          value={value?.number_value ?? ""}
          onChange={(e) => onChange({ number_value: e.target.value })}
          style={{ marginTop: 8, padding: 10, borderRadius: 12 }}
        >
          <option value="">Select</option>
          {Array.from({ length: max }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (q.qtype === "SINGLE") {
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {opts.map((o) => (
            <label
              key={o.id}
              style={{ display: "flex", gap: 10, alignItems: "center" }}
            >
              <input
                type="radio"
                checked={value?.option_id === o.id}
                onChange={() => onChange({ option_id: o.id })}
                name={`single_${q.id}`}
              />
              {o.text}
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (q.qtype === "MULTI") {
    const optionIds = new Set(safeArr(value?.option_ids).map(Number));
    const toggle = (oid) => {
      const next = new Set(optionIds);
      if (next.has(Number(oid))) next.delete(Number(oid));
      else next.add(Number(oid));
      onChange({ option_ids: Array.from(next) });
    };
    return (
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.10)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {q.question} {q.is_required ? "*" : ""}
        </div>
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {opts.map((o) => (
            <label
              key={o.id}
              style={{ display: "flex", gap: 10, alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={optionIds.has(Number(o.id))}
                onChange={() => toggle(o.id)}
              />
              {o.text}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.10)",
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontWeight: 800 }}>{q.question}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
        Unsupported qtype: {q.qtype}
      </div>
    </div>
  );
}
