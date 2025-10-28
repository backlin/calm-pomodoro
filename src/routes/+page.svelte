<script lang="ts">
  import { onMount } from "svelte";

  let mode: "init" | "work" | "break" | "attention" = "init";
  let workTimer: number | null = null;
  let breakTimer: number | null = null;
  let ticker: NodeJS.Timeout | null = null;
  let beepAfterWork: boolean = true;
  let beepAfterBreak: boolean = false;
  let output: string = "";
  let audioContext: AudioContext | null = null;
  let beepBuffer: AudioBuffer | null = null;

  // Logging system
  let lastModeSwitch: number = Date.now();
  let logEntries: Array<{ mode: string; duration: number; timestamp: number }> =
    [];
  let tickCount: number = 0;

  const LOG_KEY = "calm-pomodoro-log";

  function saveLogEntries(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOG_KEY, JSON.stringify(logEntries));
    }
  }

  function loadLogEntries(): void {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(LOG_KEY);
      if (saved) {
        try {
          logEntries = JSON.parse(saved);
        } catch (error) {
          console.error("Failed to load log entries:", error);
          logEntries = [];
        }
      }
    }
  }

  function clearLog(): void {
    logEntries = [];
    saveLogEntries();
  }

  function addWork(minutes: number): void {
    const millis = minutes * 60 * 1000;

    if (mode === "work") {
      workTimer = (workTimer || 0) + millis;
      return;
    }

    logModeSwitch();
    mode = "work";
    workTimer = new Date().getTime() + millis;
    breakTimer = null;
    ticker = setInterval(() => {
      tickCount++;
    }, 1000);
  }

  function addBreak(minutes: number): void {
    const millis = minutes * 60 * 1000;

    if (mode === "break") {
      breakTimer = (breakTimer || 0) + millis;
      return;
    }

    logModeSwitch();
    mode = "break";
    breakTimer = new Date().getTime() + millis;
    workTimer = null;
    ticker = setInterval(() => {
      tickCount++;
    }, 1000);
  }

  function getMinutesRemaining(timer: number): number {
    const remaining = timer - new Date().getTime();
    return Math.ceil(remaining / (60 * 1000));
  }

  function logModeSwitch(): void {
    const now = Date.now();
    const elapsed = now - lastModeSwitch;
    const elapsedMinutes = elapsed / (60 * 1000);

    if (elapsedMinutes > 1 && mode !== "init") {
      logEntries = [
        ...logEntries,
        {
          mode: mode,
          duration: Math.round(elapsedMinutes),
          timestamp: now,
        },
      ];
      saveLogEntries();
    }

    lastModeSwitch = now;
  }

  async function initAudioContext() {
    if (!audioContext && typeof AudioContext !== "undefined") {
      audioContext = new AudioContext();

      try {
        const response = await fetch("/beep.wav");
        const arrayBuffer = await response.arrayBuffer();
        beepBuffer = await audioContext.decodeAudioData(arrayBuffer);
      } catch (error) {
        console.error("Failed to load beep sound:", error);
      }
    }
  }

  function beep() {
    if (!audioContext || !beepBuffer) {
      initAudioContext().then(() => {
        if (audioContext && beepBuffer) {
          playBeep();
        }
      });
      return;
    }

    playBeep();
  }

  function playBeep() {
    if (!audioContext || !beepBuffer) return;

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const source = audioContext.createBufferSource();
      source.buffer = beepBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error("Failed to play beep:", error);
    }
  }

  // Reactive statement to format output and handle timer logic
  $: if (tickCount >= 0) {
    if (mode === "break" && breakTimer !== null) {
      const minutes = getMinutesRemaining(breakTimer);
      if (minutes <= 0) {
        logModeSwitch();
        mode = "attention";
        breakTimer = null;
        if (ticker) {
          clearInterval(ticker);
          ticker = null;
        }
        output = "Time to work";
        if (beepAfterBreak) {
          beep();
        }
      } else {
        output = "Break " + minutes + "m";
      }
    } else if (mode === "work" && workTimer !== null) {
      const minutes = getMinutesRemaining(workTimer);
      if (minutes <= 0) {
        logModeSwitch();
        mode = "attention";
        workTimer = null;
        if (ticker) {
          clearInterval(ticker);
          ticker = null;
        }
        output = "Time for a break";
        if (beepAfterWork) {
          beep();
        }
      } else {
        output = "Work " + minutes + "m";
      }
    } else if (mode === "attention") {
      // output is already set when transitioning to attention mode
    } else if (mode === "init") {
      output = "";
    } else {
      output = "";
    }
  }

  // Reactive statement to update document title
  $: {
    if (typeof document !== "undefined") {
      document.title = output || "Calm Pomodoro";
    }
  }

  // Reactive statement to update body class
  $: {
    if (typeof document !== "undefined") {
      document.body.className = mode;
    }
  }

  onMount(() => {
    loadLogEntries();
    mode = "init";
    lastModeSwitch = Date.now();
    addWork(25);
  });
</script>

<svelte:head>
  <title>Calm Pomodoro</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
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
            }}>+25 min</button
          >
        </li>
        <li>
          <button
            on:click={() => {
              addWork(5);
            }}>+5 min</button
          >
        </li>
      </ul>
    </div>
    <button
      class="soundIcon"
      on:click={() => {
        beepAfterWork = !beepAfterWork;
        if (beepAfterWork) {
          beep();
        }
      }}
    >
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
            }}>+5 min</button
          >
        </li>
        <li>
          <button
            on:click={() => {
              addBreak(1);
            }}>+1 min</button
          >
        </li>
      </ul>
    </div>
    <button
      class="soundIcon"
      on:click={() => {
        beepAfterBreak = !beepAfterBreak;
        if (beepAfterBreak) {
          beep();
        }
      }}
    >
      {beepAfterBreak ? "🔊" : "🔇"}
    </button>
  </div>
</section>
<section id="log">
  <div class="logContainer">
    {#each logEntries as entry (entry.timestamp)}
      <div class="logEntry">
        <span
          class="log{entry.mode === 'work' ? 'Work' : 'Break'}"
          style="width: {entry.duration}rem;"
        >
          {entry.duration} m {entry.mode}
        </span>
      </div>
    {/each}
    {#if logEntries.length > 0}
      <button class="clearLog" on:click={clearLog}>Clear Log</button>
    {/if}
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
