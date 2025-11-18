import type { Schema, Struct } from '@strapi/strapi';

export interface AboutUsBodySection1 extends Struct.ComponentSchema {
  collectionName: 'components_about_us_body_section1s';
  info: {
    displayName: 'bodySection1';
  };
  attributes: {
    title: Schema.Attribute.String;
    title2: Schema.Attribute.String;
  };
}

export interface AboutUsCards extends Struct.ComponentSchema {
  collectionName: 'components_about_us_cards';
  info: {
    displayName: 'cards';
  };
  attributes: {
    content: Schema.Attribute.RichText;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.RichText;
  };
}

export interface AboutUsContent extends Struct.ComponentSchema {
  collectionName: 'components_about_us_contents';
  info: {
    displayName: 'content';
  };
  attributes: {
    content: Schema.Attribute.RichText;
  };
}

export interface AboutUsFeedbackSections extends Struct.ComponentSchema {
  collectionName: 'components_about_us_feedback_sections';
  info: {
    displayName: 'feedbackSections';
  };
  attributes: {
    buttonLink: Schema.Attribute.String;
    content: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface AboutUsFounderSection extends Struct.ComponentSchema {
  collectionName: 'components_about_us_founder_sections';
  info: {
    displayName: 'founderSection';
  };
  attributes: {
    buttonLink: Schema.Attribute.String;
    content: Schema.Attribute.Component<'about-us.content', true>;
    title: Schema.Attribute.String;
  };
}

export interface AboutUsSectionContent extends Struct.ComponentSchema {
  collectionName: 'components_about_us_section_contents';
  info: {
    displayName: 'sectionContent';
  };
  attributes: {};
}

export interface AboutUsTeamMembers extends Struct.ComponentSchema {
  collectionName: 'components_about_us_team_members';
  info: {
    displayName: 'teamMembers';
  };
  attributes: {
    bio: Schema.Attribute.Blocks;
    linkedin: Schema.Attribute.String;
    name: Schema.Attribute.String;
    photo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    position: Schema.Attribute.String;
  };
}

export interface AcQuestionOptions extends Struct.ComponentSchema {
  collectionName: 'components_ac_question_options';
  info: {
    displayName: 'options';
  };
  attributes: {
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    label: Schema.Attribute.Text;
  };
}

export interface BlogTag extends Struct.ComponentSchema {
  collectionName: 'components_blog_tags';
  info: {
    displayName: 'tag';
  };
  attributes: {
    label: Schema.Attribute.String;
  };
}

export interface FaqQuestions extends Struct.ComponentSchema {
  collectionName: 'components_faq_questions';
  info: {
    displayName: 'questions';
  };
  attributes: {
    answer: Schema.Attribute.String;
    question: Schema.Attribute.Text;
  };
}

export interface FooterSocialLinks extends Struct.ComponentSchema {
  collectionName: 'components_footer_social_links';
  info: {
    displayName: 'socialLinks';
  };
  attributes: {
    links: Schema.Attribute.Text;
  };
}

export interface HomePageBodySection extends Struct.ComponentSchema {
  collectionName: 'components_home_page_body_sections';
  info: {
    displayName: 'bodySection';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface HomePageFeatureMainContent extends Struct.ComponentSchema {
  collectionName: 'components_home_page_feature_main_contents';
  info: {
    displayName: 'featureMainContent';
  };
  attributes: {
    description: Schema.Attribute.Text;
    Title: Schema.Attribute.String;
  };
}

export interface HomePageFeatures extends Struct.ComponentSchema {
  collectionName: 'components_home_page_features';
  info: {
    displayName: 'features';
  };
  attributes: {
    feature: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface HomePageFooter extends Struct.ComponentSchema {
  collectionName: 'components_home_page_footers';
  info: {
    displayName: 'footer';
  };
  attributes: {
    email: Schema.Attribute.Email;
    links: Schema.Attribute.Component<'footer.social-links', true>;
    phone: Schema.Attribute.String;
  };
}

export interface HomePageOtherSection extends Struct.ComponentSchema {
  collectionName: 'components_home_page_other_sections';
  info: {
    displayName: 'OtherSection';
  };
  attributes: {
    content: Schema.Attribute.RichText;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    title: Schema.Attribute.String;
  };
}

export interface HomePageTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_home_page_testimonials';
  info: {
    displayName: 'testimonial';
  };
  attributes: {
    content: Schema.Attribute.Text;
    name: Schema.Attribute.String;
    profile: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
  };
}

export interface HowitworksSteps extends Struct.ComponentSchema {
  collectionName: 'components_howitworks_steps';
  info: {
    displayName: 'Steps';
  };
  attributes: {
    StepDescription: Schema.Attribute.RichText;
    StepNumber: Schema.Attribute.Integer;
    StepTitle: Schema.Attribute.Text;
    videoURL: Schema.Attribute.Text;
  };
}

export interface PlanFeatureFeatures extends Struct.ComponentSchema {
  collectionName: 'components_plan_feature_features';
  info: {
    displayName: 'features';
  };
  attributes: {
    feature: Schema.Attribute.String;
  };
}

export interface PricingFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_pricing_feature_items';
  info: {
    displayName: 'FeatureItem';
  };
  attributes: {
    planName: Schema.Attribute.String;
    planStatus: Schema.Attribute.Boolean;
    RenewsOn: Schema.Attribute.Date;
  };
}

export interface PricingPlans extends Struct.ComponentSchema {
  collectionName: 'components_pricing_plans';
  info: {
    displayName: 'plans';
    icon: 'priceTag';
  };
  attributes: {
    description: Schema.Attribute.Text;
    feature: Schema.Attribute.Component<'plan-feature.features', true>;
    price: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    displayName: 'seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.String;
    metaImage: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
    metaTitle: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'about-us.body-section1': AboutUsBodySection1;
      'about-us.cards': AboutUsCards;
      'about-us.content': AboutUsContent;
      'about-us.feedback-sections': AboutUsFeedbackSections;
      'about-us.founder-section': AboutUsFounderSection;
      'about-us.section-content': AboutUsSectionContent;
      'about-us.team-members': AboutUsTeamMembers;
      'ac-question.options': AcQuestionOptions;
      'blog.tag': BlogTag;
      'faq.questions': FaqQuestions;
      'footer.social-links': FooterSocialLinks;
      'home-page.body-section': HomePageBodySection;
      'home-page.feature-main-content': HomePageFeatureMainContent;
      'home-page.features': HomePageFeatures;
      'home-page.footer': HomePageFooter;
      'home-page.other-section': HomePageOtherSection;
      'home-page.testimonial': HomePageTestimonial;
      'howitworks.steps': HowitworksSteps;
      'plan-feature.features': PlanFeatureFeatures;
      'pricing.feature-item': PricingFeatureItem;
      'pricing.plans': PricingPlans;
      'shared.seo': SharedSeo;
    }
  }
}
