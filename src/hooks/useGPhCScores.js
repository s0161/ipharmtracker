import { useMemo } from "react";
import { useSupabase } from "./useSupabase";

/**
 * Computes GPhC readiness scores from live Supabase data across 5 standards.
 * Each standard scores 0-100; overall is the average.
 */
export function useGPhCScores() {
  // ── Data fetching ──────────────────────────────────────────────────────
  const [nearMisses, , loadNM] = useSupabase("near_misses", []);
  const [actionItems, , loadAI] = useSupabase("action_items", []);
  const [auditLog, , loadAL] = useSupabase("audit_log", []);
  const [mhraAcks, , loadMA] = useSupabase("mhra_alert_acknowledgements", []);
  const [trainingLogs, , loadTL] = useSupabase("training_logs", []);
  const [trainingTopics, , loadTT] = useSupabase("training_topics", []);
  const [inductionCompletions, , loadIC] = useSupabase("induction_completions", []);
  const [inductionModules, , loadIM] = useSupabase("induction_modules", []);
  const [appraisals, , loadAP] = useSupabase("appraisals", []);
  const [staffMembers, , loadSM] = useSupabase("staff_members", []);
  const [fridgeLogs, , loadFL] = useSupabase("fridge_temperature_logs", []);
  const [cleaningEntries, , loadCE] = useSupabase("cleaning_entries", []);
  const [cleaningTasks, , loadCT] = useSupabase("cleaning_tasks", []);
  const [patientQueries, , loadPQ] = useSupabase("patient_queries", []);
  const [mhraFlags, , loadMF] = useSupabase("mhra_alert_flags", []);
  const [documents, , loadDO] = useSupabase("documents", []);

  const loading = loadNM || loadAI || loadAL || loadMA || loadTL || loadTT ||
    loadIC || loadIM || loadAP || loadSM || loadFL || loadCE || loadCT ||
    loadPQ || loadMF || loadDO;

  const standards = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ── Standard 1: Governance ─────────────────────────────────────────
    const incidentsThisMonth = nearMisses.filter(
      (n) => n.createdAt && new Date(n.createdAt) >= startOfMonth
    ).length;
    const m1Incidents = incidentsThisMonth > 0 ? 25 : 0;

    const totalAcks = mhraAcks.length;
    const ackedCount = mhraAcks.filter((a) => a.acknowledged).length;
    const m1Alerts = totalAcks > 0 ? Math.round((ackedCount / totalAcks) * 25) : 25;

    const totalActions = actionItems.length;
    const completedActions = actionItems.filter((a) => a.completed).length;
    const m1Actions = totalActions > 0 ? Math.round((completedActions / totalActions) * 25) : 25;

    const auditThisWeek = auditLog.filter(
      (a) => a.createdAt && new Date(a.createdAt) >= sevenDaysAgo
    ).length;
    const m1Audit = auditThisWeek > 0 ? 25 : 0;

    const s1Score = m1Incidents + m1Alerts + m1Actions + m1Audit;

    // ── Standard 2: Staff ──────────────────────────────────────────────
    const totalTopics = Math.max(trainingTopics.length, 1);
    const completedTraining = trainingLogs.filter((l) => l.status === "completed").length;
    const m2Training = Math.round(Math.min(completedTraining / totalTopics, 1) * 33);

    const totalStaff = Math.max(staffMembers.length, 1);
    const totalModules = Math.max(inductionModules.length, 1);
    const completedInductions = inductionCompletions.length;
    const inductionRatio = Math.min(completedInductions / (totalStaff * totalModules), 1);
    const m2Inductions = Math.round(inductionRatio * 33);

    const upToDateAppraisals = appraisals.filter(
      (a) => a.nextDue && new Date(a.nextDue) > now
    ).length;
    const m2Appraisals = Math.round(Math.min(upToDateAppraisals / totalStaff, 1) * 34);

    const s2Score = m2Training + m2Inductions + m2Appraisals;

    // ── Standard 3: Premises ───────────────────────────────────────────
    const fridgeToday = fridgeLogs.some(
      (f) => f.createdAt && String(f.createdAt).startsWith(todayStr)
    );
    const m3Fridge = fridgeToday ? 50 : 0;

    const totalCleanTasks = Math.max(cleaningTasks.length, 1);
    const cleanedToday = cleaningEntries.filter(
      (e) => e.createdAt && String(e.createdAt).startsWith(todayStr)
    ).length;
    const m3Cleaning = Math.round(Math.min(cleanedToday / totalCleanTasks, 1) * 50);

    const s3Score = m3Fridge + m3Cleaning;

    // ── Standard 4: Services ───────────────────────────────────────────
    const cdPattern = /\b(cd|controlled\s+drug)/i;
    const cdDoneToday = actionItems.some(
      (a) =>
        a.completed &&
        a.createdAt &&
        String(a.createdAt).startsWith(todayStr) &&
        (cdPattern.test(a.title || "") || cdPattern.test(a.description || ""))
    );
    const m4CD = cdDoneToday ? 33 : 0;

    const resolvedQueries = patientQueries.filter((q) => q.status === "resolved").length;
    const openQueries = patientQueries.filter((q) => q.status === "open").length;
    const totalQueries = resolvedQueries + openQueries;
    const m4Queries = totalQueries > 0 ? Math.round((resolvedQueries / totalQueries) * 33) : 33;

    const totalFlags = mhraFlags.length;
    const actionedFlags = mhraFlags.filter((f) => f.actioned).length;
    const m4MHRA = totalFlags > 0 ? Math.round((actionedFlags / totalFlags) * 34) : 34;

    const s4Score = m4CD + m4Queries + m4MHRA;

    // ── Standard 5: Equipment ──────────────────────────────────────────
    const latestFridge = fridgeLogs.length > 0
      ? fridgeLogs.reduce((latest, f) =>
          !latest || (f.createdAt && f.createdAt > latest.createdAt) ? f : latest
        , null)
      : null;
    let m5Fridge = 25; // no reading = 25
    if (latestFridge && latestFridge.currentTemp != null) {
      const t = Number(latestFridge.currentTemp);
      m5Fridge = t >= 2 && t <= 8 ? 50 : 0;
    }

    const totalDocs = Math.max(documents.length, 1);
    const currentDocs = documents.filter(
      (d) => d.expiryDate && new Date(d.expiryDate) > now
    ).length;
    const m5Docs = Math.round((currentDocs / totalDocs) * 50);

    const s5Score = m5Fridge + m5Docs;

    // ── Build result ───────────────────────────────────────────────────
    return [
      {
        id: 1,
        name: "Governance",
        subtitle: "Risk management & clinical audit",
        score: s1Score,
        metrics: [
          { name: "Incidents recorded this month", earned: m1Incidents, max: 25 },
          { name: "MHRA alerts acknowledged", earned: m1Alerts, max: 25 },
          { name: "Action items completed", earned: m1Actions, max: 25 },
          { name: "Audit activity this week", earned: m1Audit, max: 25 },
        ],
      },
      {
        id: 2,
        name: "Staff",
        subtitle: "Training, induction & appraisal",
        score: s2Score,
        metrics: [
          { name: "Training completion", earned: m2Training, max: 33 },
          { name: "Induction progress", earned: m2Inductions, max: 33 },
          { name: "Appraisals up to date", earned: m2Appraisals, max: 34 },
        ],
      },
      {
        id: 3,
        name: "Premises",
        subtitle: "Fridge monitoring & cleaning",
        score: s3Score,
        metrics: [
          { name: "Fridge logged today", earned: m3Fridge, max: 50 },
          { name: "Cleaning tasks today", earned: m3Cleaning, max: 50 },
        ],
      },
      {
        id: 4,
        name: "Services",
        subtitle: "CD checks, queries & recalls",
        score: s4Score,
        metrics: [
          { name: "CD check completed today", earned: m4CD, max: 33 },
          { name: "Patient queries resolved", earned: m4Queries, max: 33 },
          { name: "MHRA recalls actioned", earned: m4MHRA, max: 34 },
        ],
      },
      {
        id: 5,
        name: "Equipment",
        subtitle: "Fridge range & document validity",
        score: s5Score,
        metrics: [
          { name: "Fridge temperature in range", earned: m5Fridge, max: 50 },
          { name: "Documents current", earned: m5Docs, max: 50 },
        ],
      },
    ];
  }, [
    nearMisses, actionItems, auditLog, mhraAcks, trainingLogs, trainingTopics,
    inductionCompletions, inductionModules, appraisals, staffMembers, fridgeLogs,
    cleaningEntries, cleaningTasks, patientQueries, mhraFlags, documents,
  ]);

  const overall = useMemo(() => {
    if (standards.length === 0) return { score: 0, rating: "No Data" };
    const avg = Math.round(standards.reduce((s, st) => s + st.score, 0) / standards.length);
    return { score: avg, rating: getRating(avg) };
  }, [standards]);

  return { standards, overall, loading };
}

function getRating(score) {
  if (score >= 80) return "Inspection Ready";
  if (score >= 60) return "Mostly Ready";
  if (score >= 40) return "Needs Attention";
  return "At Risk";
}

export function getScoreColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}
