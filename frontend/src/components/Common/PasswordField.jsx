import { useState } from "react";
import PasswordChecklist from "react-password-checklist";
import { AiOutlineLock } from "react-icons/ai"; 
import InputField from "../InputField";
// import { PasswordIcon } from "@/utils/icons";

function PasswordField({
  value,
  onChange,
  name = "password",
  placeholder = "Password",
  required,
  disabled,
  error,
  inputstyle = null,
  setIsPasswordStrong, // ✅ Optional prop to expose validity
}) {
  const [touched, setTouched] = useState(false);

  return (
    <div className="space-y-2">
      <InputField
        icon={AiOutlineLock}
        type="password"
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e);
          if (!touched) setTouched(true);
        }}
        required={required}
        disabled={disabled}
        error={error}
        // icon={PasswordIcon}
        inputstyle ={inputstyle?? inputstyle}
      />

      {touched && (
        <PasswordChecklist
          rules={["minLength", "specialChar", "number", "capital"]}
          minLength={8}
          value={value}
          iconSize={12}
          onChange={(isValid) => {
            console.log(isValid,'isValid')
            if (typeof setIsPasswordStrong === "function") {
              setIsPasswordStrong(isValid);
            }
          }}
          className="[&>li>]:leading-none [&>li>]:!m-0 [&>li>span]:!opacity-80 text-xs 2xl:text-sm flex flex-wrap gap-2"
          messages={{
            minLength: "At least 8 characters",
            specialChar: "At least 1 special character",
            number: "At least 1 number",
            capital: "At least 1 capital letter",
          }}
        />
      )}
    </div>
  );
}

export default PasswordField;
