import Navbar from "../Navbar";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Users, Clock, ArrowRight } from "lucide-react";
import { createQueueEntry } from "../../services/queueEntry";
import { useAuth } from "../auth/AuthProvider";
import type { Queue, QueueEntry } from "../../types";

// Corrected paths: ../../ reaches the root 'data' folder from 'components/pages'
import hoshinoImg from "../../data/hoshino.jpg";
import kaguyaImg from "../../data/kaguya.jpg";
import yuiImg from "../../data/yui.jpg";
import nyanImg from "../../data/nyan.jpg";

function JoinQueue() {
  const navigate = useNavigate();
  const { user: authenticatedUser } = useAuth();
  const [queues, setQueues] = useState<Queue[]>([]);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [joiningQueueId, setJoiningQueueId] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<{ queueId: number; name: string } | null>(null);
  const [patientDescription, setPatientDescription] = useState("");
  const [joinModalError, setJoinModalError] = useState("");

  const cardStyles = [
    { color: "bg-blue-400", img: hoshinoImg },
    { color: "bg-pink-400", img: kaguyaImg },
    { color: "bg-purple-400", img: yuiImg },
    { color: "bg-red-500", img: nyanImg },
  ];

  useEffect(() => {
    let isCancelled = false;

    const loadQueueData = async () => {
      try {
        const [queueResponse, entryResponse] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/queue`),
          fetch(`${import.meta.env.VITE_API_URL}/queueentry`)
        ]);

        if (!queueResponse.ok && queueResponse.status !== 204) {
          throw new Error(`Failed to load queues: ${queueResponse.status}`);
        }

        if (!entryResponse.ok && entryResponse.status !== 204) {
          throw new Error(`Failed to load queue entries: ${entryResponse.status}`);
        }

        if (isCancelled) {
          return;
        }

        setQueues(queueResponse.status === 204 ? [] : await queueResponse.json());
        setEntries(entryResponse.status === 204 ? [] : await entryResponse.json());
        setSubmitError("");
      } catch (error) {
        console.error("Error loading queues", error);
        if (!isCancelled) {
          setQueues([]);
          setEntries([]);
          setSubmitError("Unable to load live queues right now.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadQueueData();
    const timer = window.setInterval(() => {
      void loadQueueData();
    }, 10000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const services = useMemo(() => {
    return queues
      .filter((queue) => queue.status === "Open")
      .map((queue, index) => {
        const waitingCount = entries.filter((entry) => entry.queueId === queue.id && entry.status === "Waiting").length;
        const inProgressCount = entries.filter((entry) => entry.queueId === queue.id && entry.status === "InProgress").length;
        const cardStyle = cardStyles[index % cardStyles.length];

        return {
          queueId: queue.id,
          id: `queue-${queue.id}`,
          name: queue.service?.name ?? `Queue ${queue.id}`,
          currentQueue: waitingCount,
          inProgressCount,
          color: cardStyle.color,
          img: cardStyle.img,
          duration: queue.service?.duration ?? 15,
        };
      });
  }, [entries, queues]);

  const handleJoinClick = (service: { queueId: number; name: string }) => {
    if (!authenticatedUser) {
      navigate("/login");
      return;
    }

    setSubmitError("");
    setJoinModalError("");
    setPatientDescription("");
    setSelectedService(service);
  };

  const handleCloseJoinModal = () => {
    if (joiningQueueId !== null) {
      return;
    }

    setSelectedService(null);
    setPatientDescription("");
    setJoinModalError("");
  };

  const handleConfirmJoin = async () => {
    if (!authenticatedUser || !selectedService) {
      return;
    }

    try {
      setJoiningQueueId(selectedService.queueId);
      setSubmitError("");
      setJoinModalError("");

      const trimmedDescription = patientDescription.trim();

      await createQueueEntry({
        queueId: selectedService.queueId,
        userId: authenticatedUser.email,
        description: trimmedDescription.length > 0 ? trimmedDescription : null,
      });

      localStorage.setItem("activeQueue", JSON.stringify({
        queueId: selectedService.queueId,
        userId: authenticatedUser.email,
        userName: authenticatedUser.name,
        serviceName: selectedService.name,
      }));

      setSelectedService(null);
      setPatientDescription("");

      navigate("/dashboard", {
        state: {
          fullName: authenticatedUser.name,
          serviceName: selectedService.name,
          showSuccessModal: true,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setJoinModalError(`Unable to join queue: ${message}`);
    } finally {
      setJoiningQueueId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Schale Clinic Registration</h1>
        </div>

        {submitError ? (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">
            Loading live queues...
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center text-slate-500 shadow-sm">
            No open queues are available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s) => (
            <div key={s.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 hover:shadow-xl transition-all group">
              <div className={`${s.color} h-48 relative overflow-hidden flex items-center justify-center`}>
                <img 
                  src={s.img} 
                  alt={s.name} 
                  className="relative h-44 w-auto object-contain z-10 group-hover:scale-110 transition-transform duration-300" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-20" />
                <h3 className="absolute bottom-4 left-0 w-full text-center text-white font-bold uppercase tracking-widest text-[10px] z-30">
                  {s.name}
                </h3>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-black uppercase text-slate-400">
                  <span className="flex items-center gap-1"><Users size={12}/> {s.currentQueue} Waiting</span>
                  {s.inProgressCount > 0 ? (
                    <span className="flex items-center gap-1 text-amber-600">{s.inProgressCount} In Progress</span>
                  ) : null}
                  <span className="flex items-center gap-1 text-blue-500"><Clock size={12}/> {s.currentQueue * s.duration}m</span>
                </div>
                <button
                  onClick={() => handleJoinClick(s)}
                  disabled={joiningQueueId === s.queueId}
                  className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-600 transition-all flex justify-center items-center gap-2 uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joiningQueueId === s.queueId ? "Joining..." : "Join Queue"} <ArrowRight size={14}/>
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {selectedService ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Confirm Queue Join</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedService.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add a short description for your visit request. This helps staff review and prioritize your queue entry.
            </p>

            <div className="mt-5">
              <label htmlFor="patient-description" className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                Patient Description (Optional)
              </label>
              <textarea
                id="patient-description"
                rows={4}
                value={patientDescription}
                onChange={(event) => setPatientDescription(event.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <p className="mt-2 text-xs text-slate-400">You can leave this blank.</p>
            </div>

            {joinModalError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {joinModalError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCloseJoinModal}
                disabled={joiningQueueId !== null}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmJoin()}
                disabled={joiningQueueId === selectedService.queueId}
                className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joiningQueueId === selectedService.queueId ? "Joining..." : "Confirm Join"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default JoinQueue;