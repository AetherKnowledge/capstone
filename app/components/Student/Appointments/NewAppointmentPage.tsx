"use client";
import { NewAppointmentData } from "@/lib/schemas";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MdOutlineArrowBackIos } from "react-icons/md";
import { CounselorData } from "../Counselors/CounselorsActions";
import { createNewAppointment } from "./AppointmentActions";
import ConcernPicker from "./Booking/ConcernPicker";
import CounselorPicker from "./Booking/CounselorPicker";
import DatePicker from "./Booking/DatePicker";
import TimePicker from "./Booking/TimePicker";

const BookAppointment = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [tos, setTos] = useState(false);
  const [dpa, setDpa] = useState(false);
  const [dateTime, setDateTime] = useState<Date | null>(null);
  const [counselor, setCounselor] = useState<CounselorData | null>(null);
  const [concerns, setConcerns] = useState<string[]>([]);

  useEffect(() => {
    if (page === 0) {
      router.push("/user/appointments");
    } else {
      setTos(false);
      setDpa(false);
    }
  }, [page, router]);

  const canProceed = () => {
    if (page === 1) return !!dateTime;
    if (page === 2) return !!counselor;
    if (page === 3) return concerns.length > 0;
    if (page === 4) return tos && dpa;
    return true;
  };

  const nextPage = () => {
    if (page === 4 && (!tos || !dpa)) return;
    setPage((p) => p + 1);
  };

  const prevPage = () => {
    setPage((p) => (p > 0 ? p - 1 : 0));
  };

  const handleSubmit = async () => {
    if (!dateTime || !counselor || concerns.length === 0) return;

    const appointmentData = {
      counselorId: counselor.id,
      schedule: dateTime,
      concerns: concerns,
    } as NewAppointmentData;

    try {
      await createNewAppointment(appointmentData);

      setTimeout(() => {
        setPage(0); // Redirect to appointments page after 2 seconds
      }, 2000);
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
  };

  return (
    <div className="flex flex-col h-[82vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b rounded-t-2xl text-base-content bg-base-100">
        <h2 className="text-3xl font-bold text-primary">Book Appointments</h2>
        <motion.div
          initial={{ opacity: 0.7 }}
          whileHover={{ scale: 1.08, opacity: 1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Link href="/user/appointments">
            <MdOutlineArrowBackIos className="text-3xl text-base-content cursor-pointer" />
          </Link>
        </motion.div>
      </div>

      <div className="divider mt-[-8] px-3" />

      {/* Pages */}
      {page === 1 && <DateTimePicker onChange={setDateTime} />}
      {page === 2 && <CounselorPicker onChange={setCounselor} />}
      {page === 3 && <ConcernPicker onChange={setConcerns} />}
      {page === 4 && (
        <Confirmation tos={tos} setTos={setTos} dpa={dpa} setDpa={setDpa} />
      )}
      {page === 0 || page === 5 ? <LoadingScreen /> : null}

      {/* Navigation */}
      {page !== 5 && (
        <div className="flex items-center justify-between p-8 text-base-content">
          <button className="btn btn-outline w-30 text-md" onClick={prevPage}>
            Back
          </button>
          <button
            className={`btn w-30 text-md ${
              page === 4 ? "btn-primary" : "btn-outline"
            } ${!canProceed() ? "btn-disabled" : ""}`}
            onClick={() => {
              nextPage();
              if (page === 4) {
                handleSubmit();
              }
            }}
          >
            {page === 4 ? "Submit" : "Next"}
          </button>
        </div>
      )}
    </div>
  );
};

// Reusable Components

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-full space-y-4">
    <div className="loading loading-spinner loading-lg text-primary"></div>
    <p className="text-base-content">Loading...</p>
  </div>
);

const Confirmation = ({
  tos,
  dpa,
  setTos,
  setDpa,
}: {
  tos: boolean;
  dpa: boolean;
  setTos: (v: boolean) => void;
  setDpa: (v: boolean) => void;
}) => (
  <div className="flex flex-col gap-20 px-5 h-full text-base-content">
    <div className="text-2xl font-semibold">Check Personal Information</div>

    <div className="space-y-8 text-center text-lg">
      <InfoBlock label="Name" value="JC Rosuelo" />
      <InfoBlock label="Course/Grad" value="BSIT" />
      <InfoBlock label="Section" value="3B" />
    </div>

    <div className="flex flex-col items-center gap-4">
      <label className="label cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-primary mr-2"
          checked={tos}
          onChange={(e) => setTos(e.target.checked)}
        />
        <span className="label-text">Agree in terms and conditions</span>
      </label>
      <label className="label cursor-pointer">
        <input
          type="checkbox"
          className="checkbox checkbox-primary mr-2"
          checked={dpa}
          onChange={(e) => setDpa(e.target.checked)}
        />
        <span className="label-text">Agree in Data Privacy Act</span>
      </label>
    </div>
  </div>
);

const InfoBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-3">
    <p className="font-medium text-md">{label}:</p>
    <p className="text-4xl">{value}</p>
  </div>
);

const DateTimePicker = ({ onChange }: { onChange?: (value: Date) => void }) => {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  useEffect(() => {
    if (selectedDate && selectedTime) {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const [h, min] = selectedTime.split(":").map(Number);
      const date = new Date(y, m - 1, d, h, min);
      onChange?.(date);
    }
  }, [selectedDate, selectedTime, onChange]);

  return (
    <div className="flex flex-col gap-10 px-5 h-full">
      <div className="text-2xl font-semibold text-base-content">
        Pick a Preferred Date & Time
      </div>
      <div className="flex flex-col lg:flex-row items-center justify-center gap-15">
        <DatePicker onChange={setSelectedDate} />
        <TimePicker onChange={setSelectedTime} />
      </div>
    </div>
  );
};

export default BookAppointment;
