import logo from "../assets/LOGOCV.png";

export default function Dashboard() {

  const profile = {
    name: "User",
    age: "22",
    gender: "Male",
    phone: "9876543210",
    emergency: "Dad - 9871234560",
  };

  return (
    <div className="min-h-screen bg-[#F5F9FF] px-6 py-6">

      <div className="flex items-center gap-3 mb-6">
        <img src={logo} className="w-10 h-10" />
        <h1 className="text-2xl font-bold text-blue-600">Dashboard</h1>
      </div>

      {/* Profile */}
      <div className="bg-white p-6 rounded-2xl shadow border border-blue-100 mb-6">
        <h2 className="text-xl font-bold text-blue-700 mb-2">Profile</h2>

        {Object.entries(profile).map(([key, val]) => (
          <p key={key} className="text-gray-700 mb-1">
            <span className="font-semibold capitalize">{key}: </span> {val}
          </p>
        ))}

        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700">
          Edit Profile
        </button>
      </div>

      {/* Family Contacts */}
      <div className="bg-white p-6 rounded-2xl shadow border border-blue-100">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Emergency Contacts</h2>

        <p className="text-gray-700">Dad – 9871234560</p>

        <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700">
          Add Contact
        </button>
      </div>

    </div>
  );
}
