"use client";

import { useEffect, useRef } from "react";
import { loadRoutineProfile, saveRoutineProfile } from "@/lib/routineSync";
import {
  getSnapshot,
  replaceRoutines,
  sanitizeRoutines,
} from "@/lib/routineStore";
import { useRoutines } from "@/lib/useRoutines";

/**
 * 화면에는 아무것도 그리지 않고, 로그인한 사람의 루틴을 계정과 맞춘다.
 *  - 들어오면 계정에 저장된 루틴이 있으면 그 내용으로 바꾼다.
 *    계정에 없고 이 기기에만 있으면 계정으로 올린다.
 *  - 루틴을 바꾸면 잠시 뒤 계정에 저장한다.
 */
export default function RoutineSync() {
  const { routines } = useRoutines();
  const userId = useRef<string | null>(null);
  const ready = useRef(false);
  /** 아직 계정에 저장하지 못한 변경이 있는지 */
  const dirty = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const profile = await loadRoutineProfile();
      if (!alive) return;
      if (profile) {
        userId.current = profile.userId;
        const remote = sanitizeRoutines(profile.routines);
        if (remote.length > 0) {
          replaceRoutines(remote);
        } else if (getSnapshot().length > 0) {
          saveRoutineProfile(profile.userId, getSnapshot());
        }
      }
      ready.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready.current || !userId.current) return;
    const uid = userId.current;
    dirty.current = true;
    const timer = setTimeout(() => {
      dirty.current = false;
      saveRoutineProfile(uid, routines);
    }, 600);
    return () => clearTimeout(timer);
  }, [routines]);

  // 저장하고 바로 다른 화면으로 나가도 변경이 사라지지 않게, 나갈 때 남은 변경을 바로 저장한다.
  useEffect(() => {
    return () => {
      if (dirty.current && userId.current) {
        dirty.current = false;
        saveRoutineProfile(userId.current, getSnapshot());
      }
    };
  }, []);

  return null;
}
