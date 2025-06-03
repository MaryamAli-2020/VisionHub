interface NewsItem {
  id: string;
  title: string;
  date: string;
  description: string;
  image: string;
  category: string;
  url?: string;
  requirements?: {
    education: string;
    skills: string[];
  };
  responsibilities?: string[];
  engagement?: {
    views: number;
    likes: number;
    comments: number;
  };
}

export const newsAndEvents: NewsItem[] = [
  // News Updates
  {
    id: 'streaming-future',
    title: 'The Future of Streaming Is a Blast From the Past',
    date: 'June 1, 2025',
    description: 'Bundling, password crackdowns and price increases will only go so far for subscription streaming platforms. Up next may be a return to aggregating content from different providers, like traditional pay TV packages did.',
    image: 'https://i.pinimg.com/736x/92/2c/3a/922c3a3502a74b20ac957462acc8ef1d.jpg',
    category: 'News Updates',
    url: 'https://www.hollywoodreporter.com/business/business-news/future-of-streaming-deloitte-pay-tv-1236173137/'
  },
  {
    id: 'digital-trends-2025',
    title: '2025 Digital Media Trends: Social platforms are becoming a dominant force',
    date: 'May 15, 2025',
    description: 'People still want the TV and movie experience offered by traditional studios, but social platforms are becoming competitive for their entertainment time—and even more competitive for the business models that studios have relied on.',
    image: 'https://i.pinimg.com/736x/dd/9d/ac/dd9dacf7b4541a45d814672304f87d0c.jpg',
    category: 'News Updates',
    url: 'https://www2.deloitte.com/us/en/insights/industry/technology/digital-media-trends-consumption-habits-survey/2025.html'
  },
  {
    id: 'streaming-trends-2025',
    title: '3 trends that could define streaming in 2025',
    date: 'May 1, 2025',
    description: 'In a shocker to no one, the streaming revolution isn\'t slowing down. Streaming viewership increased by 7.6% year over year, according to Nielsen, and households devoted an average of nearly 42% of their TV time streaming shows and movies.',
    image: 'https://i.pinimg.com/736x/cb/b9/9f/cbb99f34e6b35d03f874ad795c5cb178.jpg',
    category: 'News Updates',
    url: 'https://www.marketingbrew.com/stories/2024/12/16/three-trends-that-could-define-streaming-in-2025'
  },
  {
    id: 'tv-predictions',
    title: '3 Predictions for TV in the Next 10 Years',
    date: 'April 15, 2025',
    description: 'Exponential advances in technology have changed entire industries, especially over the past 10 to 15 years. In media and television, the likes of Netflix, Amazon Prime, Disney, and other digital channels or streaming services have acted as massive disruptive forces.',
    image: 'https://images.unsplash.com/photo-1646861039459-fd9e3aabf3fb?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8dHZ8ZW58MHwwfDB8fHwy',
    category: 'News Updates',
    url: 'https://www.investopedia.com/articles/investing/021816/3-predictions-tv-next-10-years.asp'
  },
  {
    id: 'olympics-streaming',
    title: 'The Olympics Showed Us Streaming\'s Future. It Looks a Lot Like TV\'s Past',
    date: 'March 15, 2024',
    description: 'Peacock won a gold medal in streaming for the 2024 Olympics, offering subscribers new ways to keep up with their favorite sports and teams, while delivering access to more events than ever before.',
    image: 'https://images.unsplash.com/photo-1722969561537-4ed6b3b98b50?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8T2x5bXBpY3N8ZW58MHwwfDB8fHwy',
    category: 'News Updates',
    url: 'https://www.thefastmode.com/expert-opinion/37800-the-olympics-showed-us-streaming-s-future-it-looks-a-lot-like-tv-s-past'
  },
  {
    id: 'broadcast-streaming-future',
    title: 'The Future Of Television Is Broadcast & Streaming: Here\'s Why',
    date: 'February 28, 2024',
    description: 'The television continues to evolve, the NBA\'s new media rights agreement is indicative of the future direction of the medium. Last month, the NBA added NBC/Peacock and Amazon Prime Video as media partners and dropped TNT which had been televising games since 1988.',
    image: 'https://images.unsplash.com/photo-1693328604570-ade5a23ce2cd?w=700&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGJyb2FkY2FzdHxlbnwwfDB8MHx8fDI%3D',
    category: 'News Updates',
    url: 'https://www.forbes.com/sites/bradadgate/2024/08/08/the-future-of-television-is-broadcast--streaming-heres-why/'
  },
  {
    id: 'vtuber-streaming',
    title: 'How to Create a Vtuber Avatar and Start Streaming',
    date: 'January 15, 2024',
    description: 'As the daybreak of the metaverse quickly approaches, the lines between real life and virtual reality are getting thinner by the minute. When it comes to web eminence and popularity, "realness" is no longer a need for eager fans and adherents.',
    image: 'https://i.pinimg.com/736x/68/1b/9c/681b9cc67c560a65195190ce8dc8cb75.jpg',
    category: 'News Updates',
    url: 'https://www.analyticsinsight.net/tech-news/how-to-create-a-vtuber-avatar-and-start-streaming'
  },
  {
    id: 'ai-streaming',
    title: 'Streaming Into The Future: How AI Is Reshaping Entertainment',
    date: 'January 5, 2024',
    description: 'In the digital age, where entertainment is but a click away, a silent yet powerful transformation is underway. Streaming companies, the vanguards of this digital entertainment era, are not just delivering content; they\'re crafting experiences, and artificial intelligence (AI) is their most adept tool.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1000&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YWl8ZW58MHwwfDB8fHwy',
    category: 'News Updates',
    url: 'https://www.forbes.com/sites/neilsahota/2024/03/18/streaming-into-the-future-how-ai-is-reshaping-entertainment/?sh=2d8a84c13056'
  },

  // Press Publications
  {
    id: 'visionhub-transform',
    title: 'VISIONHUB Broadcasting Corporation Transforms Broadcast with a Professional Internet TV Platform',
    date: 'February 10, 2023',
    description: 'Audio, video and other media content and services delivered over the internet, also known as over-the-top (OTT) services, bypass traditional distribution channels such as cable and satellite television. The OTT market in Canada was valued at approximately CAD 2 billion in 2020 and is expected to continue to grow in the coming years.',
    image: 'https://i.pinimg.com/736x/4a/c3/16/4ac316f9d1f522fd11e6c550ee73cf6c.jpg',
    category: 'Press Publications',
    url: 'https://www.prlog.org/12950846-visionhub-broadcasting-corporation-transforms-broadcast-with-professional-internet-tv-platform.html'
  },
  {
    id: 'visionhub-features',
    title: 'VISIONHUB Broadcasting Corporation Offers Unique Features Within a Streaming Platform',
    date: 'June 18, 2022',
    description: 'Television is moving towards Internet-based services with the increasing popularity of online streaming services. Cable TV has become a relic of an old era. People are scrapping their cable subscriptions in favour of cheaper internet-based options to get personalized content that fits their circle of interest.',
    image: 'https://i.pinimg.com/736x/5b/ba/ad/5bbaad8bd7c17c9da41f1c07a27e7f0f.jpg',
    category: 'Press Publications',
    url: 'https://www.prlog.org/12921790-visionhub-broadcasting-corporation-offers-unique-features-within-streaming-platform.html' },
  {
    id: 'visionhub-launch',
    title: 'VISIONHUB Broadcasting Corporation Creates a Streaming Digital Platform with Social Network Features',
    date: 'January 6, 2022',
    description: 'Social networks and media content are viral nowadays. Many creative people strive to find a platform that will connect them with professionals in the media industry to cooperate, create unique content and publish it online.',
    image: 'https://i.pinimg.com/736x/1e/67/6f/1e676fabdbac684fd7910c2d4d6801d2.jpg',
    category: 'Press Publications',
    url: 'https://www.prlog.org/12899845-visionhub-broadcasting-corporation-creates-streaming-digital-platform-with-social-network-features.html'
  },
  // Events we can't miss
  {
    id: 'cabsat-2023',
    title: 'CABSAT 2023',
    date: 'May 16-18, 2023',
    description: 'CABSAT in Dubai was a melting pot of innovation, showcasing the latest trends in media technology. We immersed ourselves in the event, attending insightful seminars and panel discussions that explored diverse topics such as virtual reality, artificial intelligence, cloud-based solutions, and 5G integration. These sessions enabled us to stay at the forefront of industry advancements and further fuel our commitment to delivering state-of-the-art solutions to our valued clients.',
    image: 'https://img1.wsimg.com/isteam/ip/0cc317c9-58cd-47a0-b3db-a1c1542acd40/IMG_6604.jpg/:/cr=t:16.67%25,l:0%25,w:100%25,h:66.67%25/rs=w:1438,h:719,cg:true',
    category: 'Events we can\'t miss',
    url: 'https://visionhub.tv/events'
  },
  {
    id: 'cabsat-2022',
    title: 'CABSAT 2022',
    date: 'May 17-19, 2022',
    description: 'The most popular broadcast exhibition CABSAT took place in Dubai with more than 10,000 key buyers and decision-makers relevant to the industry. Such exhibitions give unlimited opportunities to boost business network, reinforce brand and convert prospects into customers. If you\'re in the business of Content Creation, Production, Post production, Satellite, Delivery & Distribution - Make sure you\'re at CABSAT next year!',
    image: 'https://img1.wsimg.com/isteam/ip/0cc317c9-58cd-47a0-b3db-a1c1542acd40/699ffd86-be84-4f37-9592-ec3611203ed6%20(002).JPG/:/cr=t:12.41%25,l:0%25,w:100%25,h:75.18%25/rs=w:1240,h:620,cg:true',
    category: 'Events we can\'t miss',
    url: 'https://visionhub.tv/events'
  },
  {
    id: 'ibc-2022',
    title: 'IBC2022',
    date: 'September 9-12, 2022',
    description: 'IBC2022\'s return as a face-to-face show delivered packed halls, standing room only in theatres, bustling networking events and crammed meeting schedules. 37,071 attendees from over 170 countries were onsite at the RAI to see over 1000+ exhibitors showcasing innovation and cutting-edge technology. "It\'s great to see, feel and hear the buzz of a live IBC once more" said Michael Crimp, IBC Chief Executive Officer.',
    image: 'https://img1.wsimg.com/isteam/ip/0cc317c9-58cd-47a0-b3db-a1c1542acd40/IBC%20Show%202.jpeg/:/cr=t:4.59%25,l:0%25,w:100%25,h:61.11%25/rs=w:768,h:577,cg:true',
    category: 'Events we can\'t miss',
    url: 'https://visionhub.tv/events'
  },
  {
    id: 'telecom-summit-2025',
    title: 'THE CANADIAN TELECOM SUMMIT',
    date: 'June 3-4, 2025',
    description: 'Now in its 23rd year, The Canadian Telecom Summit is Canada\'s leading ICT event, attracting the most influential people who shape the future direction of communications and information technology in Canada.',
    image: 'https://i.pinimg.com/736x/6b/e9/85/6be9853b07d3a4d832f243344a7998da.jpg',
    category: 'Other Webinars and Conferences',
    url: 'https://www.telecomsummit.com/'
  },
  {
    id: 'wab-conference-2025',
    title: 'Western Association of Broadcasters Conference 2025',
    date: 'May 28-29, 2025',
    description: 'The Western Association of Broadcasters is an association of and for the private radio and television stations of Alberta, Saskatchewan and Manitoba. Our members represent the best and brightest in Western broadcasting.',
    image: 'https://broadcastdialogue.com/wp-content/uploads/2024/02/WAB.png',
    category: 'Other Webinars and Conferences',
    url: 'https://www.wab.ca/schedule'
  },
  {
    id: 'gbta-2025',
    title: 'GBTA Broadcast Studio',
    date: 'April 28-30, 2025',
    description: 'Join us in Toronto for the 2025 GBTA Canada Conference at the Automotive Building as we bring together the business travel community again to network, learn from industry experts, and benefit from peer-to-peer education.',
    image: 'https://images.squarespace-cdn.com/content/v1/5472024be4b00ae90ac33969/023301c1-ae17-4ac9-8505-8be4687ba324/gbta_logo_reverse.jpg',
    category: 'Other Webinars and Conferences',
    url: 'https://canadaconference.gbta.org/'
  },
  {
    id: 'digimarcon-2025',
    title: 'DigiMarCon Canada West 2025',
    date: 'April 10-11, 2025',
    description: 'DigiMarCon Canada West, the Premier Digital Marketing, Media and Advertising Conference & Exhibition in Western Canada returns at the luxurious Paradox Hotel Vancouver in Vancouver, British Columbia.',
    image: 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F829165939%2F76167928213%2F1%2Foriginal.20240818-063821?w=512&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C0%2C2160%2C1080&s=4fb09ae0f5ab6617f0f0ec20b8b977d5',
    category: 'Other Webinars and Conferences',
    url: 'https://digimarconcanadawest.ca/'
  },
  {
    id: 'source-stream-2025',
    title: 'Source to Stream Conference 2025',
    date: 'March 26-27, 2025',
    description: 'The Source to Stream Conference features renowned speakers presenting the latest technological innovations, case study findings, and academic research in stormwater and erosion control. The conference includes a trade show for delegates to engage with leading solutions providers.',
    image: 'https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F823273319%2F1938040609403%2F1%2Foriginal.20240808-164447?h=200&w=512&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C185%2C860%2C430&s=ceae7cf035a19a107d6601846cc38072',
    category: 'Other Webinars and Conferences',
    url: 'https://10times.com/e1rr-d4z8-xh52'
  },
  {
    id: 'streaming-media-connect-2024',
    title: 'Streaming Media Connect',
    date: 'February 19-22, 2024',
    description: 'Streaming Media Connect events offer practical advice, inspiring thought leadership, actionable insights, and lively debate. You\'ll hear the innovative approaches that the world\'s leading organizations and experts are deploying in live streaming, OTT, content delivery, content monetization, and much more.',
    image: 'https://i.ytimg.com/vi/ZMyRKa_hWT8/hq720.jpg?sqp=-oaymwEXCK4FEIIDSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLBbrJQpj5NhgE4lyHjo6dzGlBvTAQ',
    category: 'Other Webinars and Conferences',
    url: 'https://www.streamingmedia.com/Conferences/Connect2024/Default.aspx'
  },
  {
    id: 'streaming-media-east-2023',
    title: 'Streaming Media East 2023',
    date: 'May 18-19, 2023',
    description: 'The Leading Event For Streaming Video Professionals! See where the world of online video is going, and how to get there first when you join industry peers to learn, share, and celebrate the disruptive trends shaping the future of digital media.',
    image: 'https://pbs.twimg.com/media/FwbARzLX0AEv1mR.jpg',
    category: 'Other Webinars and Conferences',
    url: 'https://www.streamingmedia.com/Conferences/Connect2022/Default.aspx'
  },
  {
    id: 'streaming-summit-2023',
    title: 'Streaming Summit',
    date: 'April 17-18, 2023',
    description: 'The Streaming Summit covered business and technology topics including bundling of content, codecs, transcoding, live streaming, video advertising, packaging and playback, monetization of video, cloud based workflows, direct-to-consumer models, and the video ad stack.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjfnLm7CxeqiTe79Wf_Z_B8sC8QxRrQGFcFg&s',
    category: 'Other Webinars and Conferences',
  },
  {
    id: 'nab-show-2023',
    title: 'NAB Show',
    date: 'April 15-19, 2023',
    description: 'The 2023 NAB Show Centennial was the pinnacle for all in the global broadcast, media and entertainment industry. A portal to next-generation technology, a catalyst for best-in-breed products, and a place to experience the power of possibility in people met and products discovered.',
    image: 'https://www.nab.org/images/og/NABShow2023.png',
    category: 'Other Webinars and Conferences',
    url: 'https://www.nabshow.com/2023/learn/conferences/streaming-summit/'
  },

  // Webinars
  {
    id: 'techbeat-summit-2024',
    title: 'TechBeat Summit 2024',
    date: 'December 11, 2024',
    description: 'Join us for an exciting in-person event at The Westin Harbour Castle, Toronto. Get ready to immerse yourself in the latest tech trends, network with industry professionals, and attend engaging workshops and panels.',
    image: 'https://cdn.evbuc.com/images/874269959/2393475623313/1/logo.20241014-192853',
    category: 'Webinars',
    engagement: {
      views: 5123,
      likes: 1789,
      comments: 232},
    url: 'https://www.youtube.com/watch?v=EE86-VjDnXc'
  },
  {
    id: 'streaming-media-connect-2024',
    title: 'Streaming Media Connect',
    date: 'February 19-22, 2024',
    description: 'This event successfully concluded with over 1000 attendees joining virtually. The sessions covered practical insights on live streaming, OTT, content delivery, and monetization strategies. All sessions were recorded and are available for registered attendees.',
    image: 'https://i.ytimg.com/vi/ZMyRKa_hWT8/hqdefault.jpg',
    category: 'Webinars',
    engagement: {
      views: 2547,
      likes: 893,
      comments: 156
    },
    url: 'https://www.youtube.com/watch?v=p_TVFvephZc'
  },
  {
    id: 'streaming-media-east-2023',
    title: 'Streaming Media East 2023',
    date: 'May 18-19, 2023',
    description: 'This successful event brought together streaming professionals from around the world. Attendees gained valuable insights into the future of online video. Session recordings and presentation materials are now available in our content library.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcST_r5e-QN7QDRwQHqnarsnLV5jTWlo6JRZbA&s',
    category: 'Webinars',
    engagement: {
      views: 3842,
      likes: 1256,
      comments: 234
    },
    url: 'https://www.youtube.com/watch?v=3IN0JyVNScs'
  },
  {
    id: 'ana-media-2023',
    title: 'ANA Media Conference',
    date: 'February 15-17, 2023',
    description: 'The conference successfully concluded with leading brand and media marketers sharing innovative solutions to industry challenges. Access the recorded sessions to learn about the strategies and insights shared during this impactful event.',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfTsASzvdM08F4uVc2B0zFeSzZk-c7A-u26Q&s',
    category: 'Webinars',
    engagement: {
      views: 2189,
      likes: 745,
      comments: 128
    },
  },
  {
    id: 'streaming-forum-2022',
    title: 'Streaming Forum Connect',
    date: 'October 19, 2022',
    description: 'This virtual event featured three engaging webinars with expert panels discussing the best in streaming technology and trends. All sessions were recorded and are available in our content library.',
    image: 'https://blog-frontend.envato.com/cdn-cgi/image/width=2400,quality=75,format=auto/uploads/sites/2/2022/09/ExpertRoundup-LiveStreamVideo.jpeg',
    category: 'Webinars',
    engagement: {
      views: 4521,
      likes: 1876,
      comments: 342
    }
  },
  {
    id: 'streaming-west-2022',
    title: 'Streaming Media West',
    date: 'November 15-16, 2022',
    description: 'The event successfully showcased innovative approaches in live streaming, OTT, enterprise video, and content monetization. Access the recorded sessions to learn about the latest developments shared during this conference.',
    image: 'https://i.ytimg.com/vi/3IN0JyVNScs/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCYM42OuGfmuUcEshrnDARRF0dN9w',
    category: 'Webinars',
    engagement: {
      views: 3156,
      likes: 1123,
      comments: 198
    }
  },
  {
    id: 'ces-2022',
    title: 'CES® 2022',
    date: 'January 5-7, 2022',
    description: 'The event successfully showcased the next wave of innovation that shaped 2022. Featured exhibitors presented groundbreaking developments in intelligent automation and the metaverse. Access the event recordings to see the highlights.',
    image: 'https://golin.com/wp-content/uploads/2022/01/CES-2022.jpeg',
    category: 'Webinars',
    engagement: {
      views: 8934,
      likes: 3245,
      comments: 567
    }
  },
  {
    id: 'job-marketing-2025',
    title: 'Marketing and Communications Specialist',
    date: '2025-06-02',
    description: 'We are hiring! Join our dynamic team as a Marketing and Communications Specialist. In this role, you will be responsible for developing and implementing advertising campaigns, creating content, and driving our marketing strategies.',
    image: 'https://i.pinimg.com/736x/5d/1a/ac/5d1aac3be76002d4f797af9d78077714.jpg',
    category: 'Career Opportunities',
    url:'https://visionhub.tv/together-at-visionhub',
    requirements: {
      education: 'A university degree or college diploma in business marketing, public relations, or communications.',
      skills: [
        'Good communication and interpersonal skills',
        'Attention to detail for precise analysis of data',
        'Critical thinking and problem-solving skills',
        'Ability to work under pressure and motivation to succeed in a competitive environment'
      ]
    },
    responsibilities: [
      'To assess characteristics of VISIONHUB services and advise on advertising and promotion strategies',
      'To develop and implement advertising campaigns',
      'To create content and communications material for the target audience',
      'To conduct public opinion and attitude surveys to identify the interests and concerns of key customers',
      'To monitor key online marketing metrics to track success',
      'To prepare reports for the management',
      'To write up press releases, prepare presentations',
      'To stay up-to-date with marketing trends and tools'
    ],
  },
  {
    id: 'job-tech-2025',
    title: 'Software Development Engineer',
    date: '2025-06-02',
    description: 'We are hiring! Join our technology team as a Software Development Engineer. You will be responsible for network management, software development, and database administration while working on cutting-edge technology solutions.',
    image: 'https://i.pinimg.com/736x/aa/08/c9/aa08c971861fd9dcb9ed1df6cb23eb4a.jpg',
    category: 'Career Opportunities',
    url: 'https://visionhub.tv/together-at-visionhub',
    requirements: {
      education: 'A bachelor\'s degree in computer science or in another discipline with a significant programming component or completion of a college program in computer science.',
      skills: [
        'Working knowledge of relevant operating systems, software and programming',
        'Excellent problem-solving and critical thinking skills',
        'Keen attention to detail',
        'Good organization, time management and prioritization',
        'Efficient troubleshooting abilities'
      ]
    },
    responsibilities: [
      'To be responsible for network management, software development and database administration',
      'To define software, hardware and network requirements',
      'To identify and communicate technical problems, processes and solutions',
      'To assist in the development of logical and physical specifications',
      'To prepare project status reports, manuals and other documentation'
    ]
  }
];
