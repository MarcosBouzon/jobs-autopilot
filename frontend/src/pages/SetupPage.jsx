import { useState, useRef } from "react";
import Container from "@mui/material/Container";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import WelcomeStep from "./setup/WelcomeStep.jsx";
import LinkedInStep from "./setup/LinkedInStep.jsx";
import ProfileStep from "./setup/ProfileStep.jsx";
import DetailsStep from "./setup/DetailsStep.jsx";
import WorkDetailsStep from "./setup/WorkDetailsStep.jsx";
import SkillsStep from "./setup/SkillsStep.jsx";
import LlmStep from "./setup/LlmStep.jsx";

const STEPS = ["Welcome", "LinkedIn", "Resume", "Details", "Work", "Skills", "LLM"];

function SetupPage() {
  const [activeStep, setActiveStep] = useState(0);
  const resumeFileRef = useRef(null);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <Container maxWidth="md">
        <Paper sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && <WelcomeStep onNext={handleNext} />}
          {activeStep === 1 && <LinkedInStep onNext={handleNext} onBack={handleBack} />}
          {activeStep === 2 && <ProfileStep onBack={handleBack} onNext={handleNext} resumeFileRef={resumeFileRef} />}
          {activeStep === 3 && <DetailsStep onBack={handleBack} onNext={handleNext} />}
          {activeStep === 4 && <WorkDetailsStep onBack={handleBack} onNext={handleNext} />}
          {activeStep === 5 && <SkillsStep onBack={handleBack} onNext={handleNext} />}
          {activeStep === 6 && <LlmStep onBack={handleBack} resumeFileRef={resumeFileRef} />}
        </Paper>
      </Container>
    </Box>
  );
}

export default SetupPage;
