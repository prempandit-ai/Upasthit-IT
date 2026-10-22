import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { AcademicCapIcon as AcademicCapSolid } from "@heroicons/react/24/solid";
import LoadingSpinner from "../components/LoadingSpinner";
import { getRegistrationOptionsRequest, registerStudentRequest } from "../services/authService";
import { useToast } from "../context/ToastContext";
import useAuth from "../hooks/useAuth";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  departmentId: "",
  program: "",
  rollNo: "",
  academicYear: "",
  year: "",
  semester: "",
  division: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  nationality: "",
  fatherName: "",
  motherName: "",
  phone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

const Field = ({ id, label, required, children }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
    </label>
    {children}
  </div>
);

const Register = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [options, setOptions] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    getRegistrationOptionsRequest()
      .then(({ data }) => setOptions(data))
      .catch(() => {
        showToast("Could not load registration options. Check that the backend is running.", "error");
      });
  }, [showToast]);

  const semesterChoices = useMemo(() => {
    if (!form.year || !options?.semestersByYear) return [];
    return options.semestersByYear[form.year] || [];
  }, [form.year, options]);

  if (loading) {
    return <LoadingSpinner label="Restoring session..." />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "year") {
        const allowed = options?.semestersByYear?.[value] || [];
        if (!allowed.map(String).includes(String(current.semester))) {
          next.semester = "";
        }
      }
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (form.password !== form.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSubmitting(true);
    try {
      await registerStudentRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        departmentId: Number(form.departmentId),
        program: form.program,
        rollNo: Number(form.rollNo),
        academicYear: form.academicYear,
        year: form.year,
        semester: Number(form.semester),
        division: form.division,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        bloodGroup: form.bloodGroup || undefined,
        nationality: form.nationality.trim() || undefined,
        fatherName: form.fatherName.trim() || undefined,
        motherName: form.motherName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        emergencyContactName: form.emergencyContactName.trim() || undefined,
        emergencyContactRelationship: form.emergencyContactRelationship || undefined,
        emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      const message =
        error.response?.data?.errors?.[0]?.message ||
        error.response?.data?.message ||
        "Registration failed. Please try again.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
          <CheckCircleIcon className="h-9 w-9" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Registration Submitted!
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
          Your student account is <span className="font-semibold text-amber-600">pending approval</span>. A Coordinator will review your request — you will be able to log in once approved.
        </p>
        <Link
          to="/login"
          className="mt-6 rounded-xl bg-[#1e3a8a] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#172554]"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-600/20 text-white">
          <AcademicCapSolid className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 uppercase leading-none">
            DMCE IT
          </h2>
          <p className="text-[11px] font-bold tracking-[0.25em] text-cyan-600 uppercase mt-1">
            UPASTHIT
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight">
          Create Student Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Your account will be verified by a coordinator before activation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Account Information</h3>
          <Field id="reg-name" label="Full Name" required>
            <input id="reg-name" name="name" type="text" required minLength={2} value={form.name} onChange={handleChange} className={inputClass} placeholder="Your full name" />
          </Field>
          <Field id="reg-email" label="College Email" required>
            <input id="reg-email" name="email" type="email" required value={form.email} onChange={handleChange} className={inputClass} placeholder="student@dmce.ac.in" />
          </Field>
          <Field id="reg-password" label="Password" required>
            <div className="relative">
              <input id="reg-password" name="password" type={showPassword ? "text" : "password"} required minLength={8} value={form.password} onChange={handleChange} className={`${inputClass} pr-16`} placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
          <Field id="reg-confirm" label="Confirm Password" required>
            <div className="relative">
              <input id="reg-confirm" name="confirmPassword" type={showConfirm ? "text" : "password"} required minLength={8} value={form.confirmPassword} onChange={handleChange} className={`${inputClass} pr-16`} placeholder="Re-enter password" />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600">
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Academic Information</h3>
          <Field id="reg-dept" label="Department" required>
            <select id="reg-dept" name="departmentId" required value={form.departmentId} onChange={handleChange} className={inputClass}>
              <option value="">Select department</option>
              {(options?.departments || []).map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </Field>
          <Field id="reg-program" label="Academic Program" required>
            <select id="reg-program" name="program" required value={form.program} onChange={handleChange} className={inputClass}>
              <option value="">Select program</option>
              {(options?.programs || []).map((program) => (
                <option key={program} value={program}>{program}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-roll" label="Roll Number" required>
            <input id="reg-roll" name="rollNo" type="number" min="1" required value={form.rollNo} onChange={handleChange} className={inputClass} placeholder="e.g. 24" />
          </Field>
          <Field id="reg-ay" label="Academic Year" required>
            <select id="reg-ay" name="academicYear" required value={form.academicYear} onChange={handleChange} className={inputClass}>
              <option value="">Select academic year</option>
              {(options?.academicYears || []).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-year" label="Year of Study" required>
            <select id="reg-year" name="year" required value={form.year} onChange={handleChange} className={inputClass}>
              <option value="">Select year</option>
              {(options?.years || []).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-sem" label="Semester" required>
            <select id="reg-sem" name="semester" required value={form.semester} onChange={handleChange} className={inputClass} disabled={!form.year}>
              <option value="">{form.year ? "Select semester" : "Select year first"}</option>
              {semesterChoices.map((semester) => (
                <option key={semester} value={semester}>Semester {semester}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-div" label="Division" required>
            <select id="reg-div" name="division" required value={form.division} onChange={handleChange} className={inputClass}>
              <option value="">Select division</option>
              {(options?.divisions || []).map((division) => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Personal Information</h3>
          <Field id="reg-dob" label="Date of Birth">
            <input id="reg-dob" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="reg-gender" label="Gender">
            <select id="reg-gender" name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
              <option value="">Select gender</option>
              {(options?.genders || []).map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-blood" label="Blood Group">
            <select id="reg-blood" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className={inputClass}>
              <option value="">Select blood group</option>
              {(options?.bloodGroups || []).map((group) => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-nat" label="Nationality">
            <input id="reg-nat" name="nationality" type="text" value={form.nationality} onChange={handleChange} className={inputClass} placeholder="e.g. Indian" />
          </Field>
          <Field id="reg-father" label="Father's Name">
            <input id="reg-father" name="fatherName" type="text" value={form.fatherName} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="reg-mother" label="Mother's Name">
            <input id="reg-mother" name="motherName" type="text" value={form.motherName} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="reg-phone" label="Phone Number">
            <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass} placeholder="Mobile number" />
          </Field>
          <Field id="reg-address" label="Residential Address">
            <textarea id="reg-address" name="address" rows={3} value={form.address} onChange={handleChange} className={inputClass} placeholder="Street, city, pin code" />
          </Field>
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Emergency Contact</h3>
          <Field id="reg-em-name" label="Emergency Contact Name">
            <input id="reg-em-name" name="emergencyContactName" type="text" value={form.emergencyContactName} onChange={handleChange} className={inputClass} />
          </Field>
          <Field id="reg-em-rel" label="Relationship">
            <select id="reg-em-rel" name="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={handleChange} className={inputClass}>
              <option value="">Select relationship</option>
              {(options?.relationships || []).map((relationship) => (
                <option key={relationship} value={relationship}>{relationship}</option>
              ))}
            </select>
          </Field>
          <Field id="reg-em-phone" label="Emergency Contact Phone">
            <input id="reg-em-phone" name="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={handleChange} className={inputClass} />
          </Field>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-[#1e3a8a] px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-950/10 transition hover:bg-[#172554] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-slate-400">
        <span>Are you faculty? </span>
        <Link to="/register/faculty" className="font-medium text-blue-600 hover:text-blue-700">
          Register as Faculty
        </Link>
      </div>

      <div className="mt-2 text-center text-xs text-slate-400">
        <span>Already have an account? </span>
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign In
        </Link>
      </div>

      <p className="mt-6 text-center text-[11px] text-slate-400">
        © 2026 DMCE · Upasthit ERP v1.0
      </p>
    </div>
  );
};

export default Register;
