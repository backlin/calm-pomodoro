<script lang="ts">
  import { onMount } from "svelte";

  let mode: string = "init";
  let workTimer: number | null = null;
  let breakTimer: number | null = null;
  let ticker: NodeJS.Timeout | null = null;
  let beepAfterWork: boolean = true;
  let beepAfterBreak: boolean = false;
  let output: string = "";
  let log: any[] = [];

  function setMode(newMode: string): void {
    mode = newMode;
  }

  function addWork(minutes: number): void {
    const millis = minutes * 60 * 1000;

    if (mode === "work") {
      workTimer = (workTimer || 0) + millis;
      return;
    }

    setMode("work");
    workTimer = new Date().getTime() + millis;
    breakTimer = null;
    ticker = setInterval(formatOutput, 1000);
  }

  function addBreak(minutes: number): void {
    const millis = minutes * 60 * 1000;

    if (mode === "break") {
      breakTimer = (breakTimer || 0) + millis;
      return;
    }

    setMode("break");
    breakTimer = new Date().getTime() + millis;
    workTimer = null;
    ticker = setInterval(formatOutput, 1000);
  }

  function formatOutput() {
    if (mode === "break" && breakTimer !== null) {
      const minutes = getMinutesRemaining(breakTimer);
      if (minutes <= 0) {
        setMode("attention");
        breakTimer = null;
        ticker = null;
        setTitle("Time to work");
        if (beepAfterBreak) {
          beep();
        }
        return;
      }
      setTitle("Break " + minutes + "m");
      return;
    }

    if (mode === "work" && workTimer !== null) {
      const minutes = getMinutesRemaining(workTimer);
      if (minutes <= 0) {
        setMode("attention");
        workTimer = null;
        ticker = null;
        setTitle("Time for a break");
        if (beepAfterWork) {
          beep();
        }
        return;
      }
      setTitle("Work " + minutes + "m");
    }
  }

  function setTitle(title: string): void {
    output = title;
    if (typeof document !== "undefined") {
      document.title = title;
    }
  }

  function getMinutesRemaining(timer: number): number {
    const remaining = timer - new Date().getTime();
    return Math.ceil(remaining / (60 * 1000));
  }

  function beep() {
    if (typeof Audio !== "undefined") {
      const snd = new Audio(
        "data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=",
      );
      const played = snd.play();
      if (played === undefined) {
        console.log("could not play audio");
      }
    }
  }

  function populateLog() {
    console.log("populateLog() not implemented");
  }

  function toggleBeepAfterWork() {
    beepAfterWork = !beepAfterWork;
    if (beepAfterWork) {
      beep();
    }
  }

  function toggleBeepAfterBreak() {
    beepAfterBreak = !beepAfterBreak;
    if (beepAfterBreak) {
      beep();
    }
  }

  onMount(() => {
    mode = "init";
    addWork(25);
    formatOutput();
    log = [];
    populateLog();
  });

  $: {
    if (typeof document !== "undefined") {
      document.body.className = mode;
    }
  }
</script>

<svelte:head>
  <title>Calm Pomodoro</title>
</svelte:head>

<header>
  <h1>Calm Pomodoro</h1>
</header>

<section>
  <p id="output">{output}</p>
</section>

<section>
  <div class="actions">
    <div class="content">
      <h2>Work</h2>
      <ul>
        <li>
          <button
            on:click={() => {
              addWork(25);
              formatOutput();
            }}>+25 min</button
          >
        </li>
        <li>
          <button
            on:click={() => {
              addWork(5);
              formatOutput();
            }}>+5 min</button
          >
        </li>
      </ul>
    </div>
    <button class="soundIcon" on:click={toggleBeepAfterWork}>
      {beepAfterWork ? "🔊" : "🔇"}
    </button>
  </div>
  <div class="actions">
    <div class="content">
      <h2>Break</h2>
      <ul>
        <li>
          <button
            on:click={() => {
              addBreak(5);
              formatOutput();
            }}>+5 min</button
          >
        </li>
        <li>
          <button
            on:click={() => {
              addBreak(1);
              formatOutput();
            }}>+1 min</button
          >
        </li>
      </ul>
    </div>
    <button class="soundIcon" on:click={toggleBeepAfterBreak}>
      {beepAfterBreak ? "🔊" : "🔇"}
    </button>
  </div>
</section>

<footer>
  <p>
    Check out the <a
      href="http://github.com/backlin/calm-pomodoro"
      target="_blank">code on GitHub</a
    >
    or
    <a href="http://www.linkedin.com/in/cbacklin" target="_blank"
      >me on LinkedIn</a
    >.
  </p>
</footer>
