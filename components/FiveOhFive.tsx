import { useState } from 'react'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/solid'
import GradientText from './GradientText'
import cls from 'classnames'

const social = [
  {
    name: 'Twitter',
    href: 'https://twitter.com/mangomarkets',
    icon: (props) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: 'https://github.com/blockworks-foundation',
    icon: (props) => (
      <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
]

export const FiveOhFive = ({ error }) => {
  const stack = error.stack.split('\n').slice(0, 5).join('\n')
  const [showDetails, toggleDetails] = useState(false)

  const Icon = showDetails ? ChevronDownIcon : ChevronRightIcon

  return (
    <div className="bg-bg-texture flex min-h-screen flex-col bg-cover bg-bottom bg-no-repeat">
      <div className="h-2 w-screen bg-gradient-to-r from-mango-theme-green via-mango-theme-yellow-dark to-mango-theme-red-dark"></div>
      <main className="my-[-2] mx-auto w-full max-w-7xl flex-grow px-4 sm:px-6 lg:px-8">
        <div className="flex-shrink-0 pt-16">
          <img
            className="mx-auto h-12 w-auto"
            src="/assets/logotext.svg"
            alt="Workflow"
          />
        </div>
        <div className="mx-auto max-w-xl py-16 sm:py-24">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide">
              <GradientText>500 error</GradientText>
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Something went wrong
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              The page you are looking for could not be loaded.
            </p>
          </div>

          <div className="my-10 text-center">
            <div className="font-mono mt-8 rounded-lg bg-th-bkg-2 p-8 text-left text-th-fgd-1">
              <div className="flex">
                <div className="text-mango-theme-fgd-2">{error.message}</div>
                <div className="flex-grow"></div>
                <div className="flex-shrink-0 self-center">
                  <Icon
                    className="text-mango-yellow h-5 w-5"
                    aria-hidden="true"
                    onClick={() => toggleDetails(!showDetails)}
                  />
                </div>
              </div>

              <div
                style={{
                  maxHeight: showDetails ? '500px' : 0,
                  opacity: showDetails ? 1 : 0,
                }}
                className={cls('overflow-hidden transition-all')}
              >
                <div className="mt-6">{stack}</div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="mt-10 flex flex-row">
                <button
                  className="mx-2 whitespace-nowrap rounded-full bg-th-bkg-button px-6 py-2 font-bold text-th-fgd-1 hover:brightness-[1.1] focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:hover:brightness-100"
                  onClick={() => location.reload()}
                >
                  Refresh and try again
                </button>

                <a
                  className="whitespace-nowrap rounded-full bg-mango-theme-bkg-3 px-6 py-2 font-bold text-th-fgd-1 hover:brightness-[1.1] focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:hover:brightness-100"
                  href="https://discord.gg/mangomarkets"
                >
                  <div className="flex">
                    <img
                      className="mr-2 h-[20px] w-[20px]"
                      src="/assets/icons/discord.svg"
                    />
                    Join Discord
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-gray-200 py-10 text-center md:flex md:justify-between">
          <div className="mt-6 flex justify-center space-x-8 md:mt-0">
            {social.map((item, itemIdx) => (
              <a
                key={itemIdx}
                href={item.href}
                className="inline-flex text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">{item.name}</span>
                <item.icon className="h-6 w-6" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </footer>
      <div className="h-2 w-screen bg-gradient-to-r from-mango-theme-green via-mango-theme-yellow-dark to-mango-theme-red-dark"></div>
    </div>
  )
}
